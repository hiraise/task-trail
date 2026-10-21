package access_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"go.uber.org/mock/gomock"
)

func TestLogoutRevokesToken(t *testing.T) {
	module, d := newModule(t)
	d.expectVerify("rt")
	d.expectTx()
	d.tokens.EXPECT().GetForUpdate(inTx, tokenID, userID).Return(activeToken(), nil)
	d.tokens.EXPECT().Update(inTx, gomock.Any()).DoAndReturn(func(_ context.Context, rt *entity.RefreshToken) error {
		if rt.RevokedAt == nil || !rt.RevokedAt.Equal(now) {
			t.Errorf("отозванный токен: %+v", rt)
		}
		return nil
	})

	if err := module.Logout.Execute(context.Background(), "rt"); err != nil {
		t.Fatal(err)
	}
}

// Выход с украденным токеном закрывает все сессии пользователя.
func TestLogoutReusedToken(t *testing.T) {
	module, d := newModule(t)
	d.expectVerify("rt")
	d.expectTx()
	d.tokens.EXPECT().GetForUpdate(inTx, tokenID, userID).Return(token(at(now.Add(-time.Hour)), nil, now.Add(time.Hour)), nil)
	d.tokens.EXPECT().RevokeAll(outsideTx, userID, now).Return(nil)

	if err := module.Logout.Execute(context.Background(), "rt"); err != nil {
		t.Fatal(err)
	}
}

// Закрывать нечего — выход всё равно успешен.
func TestLogoutNothingToRevoke(t *testing.T) {
	cases := []struct {
		name  string
		token *entity.RefreshToken
		err   error
	}{
		{"только что обменян", token(at(now.Add(-time.Second)), nil, now.Add(time.Hour)), nil},
		{"уже закрыт", token(nil, at(now.Add(-time.Hour)), now.Add(time.Hour)), nil},
		{"истёк", token(nil, nil, now.Add(-time.Hour)), nil},
		{"нет в базе", nil, domain.ErrEntityNotFound(0, nil)},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			module, d := newModule(t)
			d.expectVerify("rt")
			d.expectTx()
			d.tokens.EXPECT().GetForUpdate(inTx, tokenID, userID).Return(c.token, c.err)
			if err := module.Logout.Execute(context.Background(), "rt"); err != nil {
				t.Fatal(err)
			}
		})
	}
	t.Run("неверный JWT", func(t *testing.T) {
		module, d := newModule(t)
		d.jwt.EXPECT().VerifyRefreshToken("rt").Return("", "", domain.ErrRefreshTokenExpired())
		if err := module.Logout.Execute(context.Background(), "rt"); err != nil {
			t.Fatal(err)
		}
	})
}

func TestLogoutRepositoryError(t *testing.T) {
	module, d := newModule(t)
	d.expectVerify("rt")
	d.expectTx()
	d.tokens.EXPECT().GetForUpdate(inTx, tokenID, userID).Return(nil, domain.ErrRepoInternal(0, errors.New("connection reset")))

	requireCode(t, module.Logout.Execute(context.Background(), "rt"), domain.RepoInternal)
}
