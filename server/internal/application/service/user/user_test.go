package user_test

import (
	"bytes"
	"context"
	"errors"
	"image"
	"image/png"
	"io"
	"testing"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/service/user"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/test/clock"
	"task-trail/test/mocks"
	"task-trail/test/txtest"

	"go.uber.org/mock/gomock"
)

const (
	userID    = entity.UserID("0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c")
	oldAvatar = entity.FileID("5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e")
)

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

type deps struct {
	tx      *mocks.MockTxManager
	users   *mocks.MockUserRepository
	files   *mocks.MockFileRepository
	storage *mocks.MockFileStorage
}

func newModule(t *testing.T) (*user.UserModule, *deps) {
	ctrl := gomock.NewController(t)
	d := &deps{
		tx:      mocks.NewMockTxManager(ctrl),
		users:   mocks.NewMockUserRepository(ctrl),
		files:   mocks.NewMockFileRepository(ctrl),
		storage: mocks.NewMockFileStorage(ctrl),
	}
	clk := clock.New(now)
	return user.New(user.Deps{
		TxManager:   d.tx,
		Clock:       clk,
		UserRepo:    d.users,
		FileRepo:    d.files,
		FileFactory: factory.NewFileFactory(id.New(), clk),
		FileStorage: d.storage,
	}), d
}

func account(avatar *entity.FileID) *entity.UserAccount {
	return &entity.UserAccount{ID: userID, Email: "ivan@example.com", AvatarID: avatar}
}

func pngUpload(t *testing.T) dto.Upload {
	t.Helper()
	var b bytes.Buffer
	if err := png.Encode(&b, image.NewRGBA(image.Rect(0, 0, 1, 1))); err != nil {
		t.Fatal(err)
	}
	return dto.Upload{Name: `C:\fakepath\photo.png`, Content: b.Bytes()}
}

func requireCode(t *testing.T, err error, code domain.ErrorCode) {
	t.Helper()
	if !domain.HasCode(err, code) {
		t.Fatalf("ожидалась ошибка %s, получено %v", code, err)
	}
}

// Файл пишется на диск до транзакции; в транзакции — запись о файле, новая аватарка
// у пользователя под блокировкой строки и пометка прежней аватарки удалённой (ADR-0013).
func TestUploadAvatar(t *testing.T) {
	module, d := newModule(t)
	upload := pngUpload(t)
	var saved entity.FileID
	d.storage.EXPECT().Save(txtest.OutsideTx, gomock.Any(), gomock.Any()).DoAndReturn(
		func(_ context.Context, id entity.FileID, content io.Reader) error {
			saved = id
			data, _ := io.ReadAll(content)
			if !bytes.Equal(data, upload.Content) {
				t.Error("на диск записано не то содержимое")
			}
			return nil
		})
	txtest.Expect(d.tx)
	d.users.EXPECT().GetForUpdate(txtest.InTx, userID).Return(account(new(oldAvatar)), nil)
	d.files.EXPECT().Create(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, f *entity.File) error {
		if f.ID != saved || f.OriginalName != "photo.png" || f.MimeType != "image/png" || f.OwnerID != userID || !f.CreatedAt.Equal(now) {
			t.Errorf("запись о файле: %+v", f)
		}
		return nil
	})
	d.users.EXPECT().Update(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, u *entity.UserAccount) error {
		if u.AvatarID == nil || *u.AvatarID != saved || !u.UpdatedAt.Equal(now) {
			t.Errorf("пользователь: %+v", u)
		}
		return nil
	})
	d.files.EXPECT().SoftDelete(txtest.InTx, oldAvatar, now).Return(nil)

	got, err := module.UploadAvatar.Execute(context.Background(), string(userID), upload)
	if err != nil {
		t.Fatal(err)
	}
	if got.AvatarID == nil || *got.AvatarID != saved {
		t.Fatalf("аватарка %v, записан файл %s", got.AvatarID, saved)
	}
}

// Первую аватарку нечего помечать удалённой.
func TestUploadFirstAvatar(t *testing.T) {
	module, d := newModule(t)
	d.storage.EXPECT().Save(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
	txtest.Expect(d.tx)
	d.users.EXPECT().GetForUpdate(txtest.InTx, userID).Return(account(nil), nil)
	d.files.EXPECT().Create(txtest.InTx, gomock.Any()).Return(nil)
	d.users.EXPECT().Update(txtest.InTx, gomock.Any()).Return(nil)
	if _, err := module.UploadAvatar.Execute(context.Background(), string(userID), pngUpload(t)); err != nil {
		t.Fatal(err)
	}
}

// Файл не того типа или больше 5 МБ не доходит до диска.
func TestUploadAvatarRejected(t *testing.T) {
	module, _ := newModule(t)
	_, err := module.UploadAvatar.Execute(context.Background(), string(userID), dto.Upload{Name: "a.png", Content: []byte("<svg></svg>")})
	requireCode(t, err, domain.FileTypeNotAllowed)
	big := pngUpload(t)
	big.Content = append(big.Content, make([]byte, entity.MaxAvatarSize)...)
	_, err = module.UploadAvatar.Execute(context.Background(), string(userID), big)
	requireCode(t, err, domain.FileTooLarge)
}

// Не прошла транзакция — записанный файл стирается (ADR-0013).
func TestUploadAvatarTxFailed(t *testing.T) {
	failure := errors.New("база недоступна")
	for name, c := range map[string]struct {
		getErr, updateErr error
		want              domain.ErrorCode
	}{
		"пользователя удалили": {getErr: domain.ErrEntityNotFound(0, nil), want: domain.AccessTokenWrong},
		"сбой записи":          {updateErr: failure},
	} {
		t.Run(name, func(t *testing.T) {
			module, d := newModule(t)
			var saved entity.FileID
			d.storage.EXPECT().Save(gomock.Any(), gomock.Any(), gomock.Any()).DoAndReturn(
				func(_ context.Context, id entity.FileID, _ io.Reader) error { saved = id; return nil })
			txtest.Expect(d.tx)
			if c.getErr != nil {
				d.users.EXPECT().GetForUpdate(txtest.InTx, userID).Return(nil, c.getErr)
			} else {
				d.users.EXPECT().GetForUpdate(txtest.InTx, userID).Return(account(nil), nil)
				d.files.EXPECT().Create(txtest.InTx, gomock.Any()).Return(nil)
				d.users.EXPECT().Update(txtest.InTx, gomock.Any()).Return(c.updateErr)
			}
			d.storage.EXPECT().Delete(txtest.OutsideTx, gomock.Any()).DoAndReturn(func(_ context.Context, id entity.FileID) error {
				if id != saved {
					t.Errorf("стёрт %s, записан %s", id, saved)
				}
				return nil
			})
			_, err := module.UploadAvatar.Execute(context.Background(), string(userID), pngUpload(t))
			if c.want != "" {
				requireCode(t, err, c.want)
			} else if !errors.Is(err, failure) {
				t.Fatalf("ошибка %v", err)
			}
		})
	}
}

func TestRename(t *testing.T) {
	name := "Иван Петров"
	for _, username := range []*string{&name, nil} {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		d.users.EXPECT().GetForUpdate(txtest.InTx, userID).Return(account(nil), nil)
		d.users.EXPECT().Update(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, u *entity.UserAccount) error {
			if u.Username != username || !u.UpdatedAt.Equal(now) {
				t.Errorf("пользователь: %+v", u)
			}
			return nil
		})
		got, err := module.Rename.Execute(context.Background(), string(userID), username)
		if err != nil || got.Username != username {
			t.Fatalf("%+v, %v", got, err)
		}
	}
}

// Пользователя удалили, а access-токен ещё жив: сессия недействительна — 401, а не 404.
func TestCurrentUserGone(t *testing.T) {
	module, d := newModule(t)
	d.users.EXPECT().GetByID(gomock.Any(), userID).Return(nil, domain.ErrEntityNotFound(0, nil))
	_, err := module.Current.Execute(context.Background(), string(userID))
	requireCode(t, err, domain.AccessTokenWrong)

	txtest.Expect(d.tx)
	d.users.EXPECT().GetForUpdate(txtest.InTx, userID).Return(nil, domain.ErrEntityNotFound(0, nil))
	_, err = module.Rename.Execute(context.Background(), string(userID), nil)
	requireCode(t, err, domain.AccessTokenWrong)
}
