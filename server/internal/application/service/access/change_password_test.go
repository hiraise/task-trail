package access_test

import (
	"context"
	"testing"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"go.uber.org/mock/gomock"
)

var passwords = dto.ChangePassword{OldPassword: "old-password", NewPassword: "new-password"}

func TestChangePassword(t *testing.T) {
	module, d := newModule(t)
	d.expectTx()
	d.users.EXPECT().GetByID(inTx, userID).Return(user(), nil)
	d.passwords.EXPECT().ComparePassword("old-password", passwordHash).Return(true, nil)
	d.passwords.EXPECT().ComparePassword("new-password", passwordHash).Return(false, nil)
	d.passwords.EXPECT().HashPassword("new-password").Return("$2a$12$new", nil)
	d.users.EXPECT().Update(inTx, gomock.Any()).DoAndReturn(func(_ context.Context, u *entity.UserAccount) error {
		if u.PasswordHash != "$2a$12$new" || !u.UpdatedAt.Equal(now) {
			t.Errorf("пользователь: %+v", u)
		}
		return nil
	})

	if err := module.ChangePassword.Execute(context.Background(), string(userID), passwords); err != nil {
		t.Fatal(err)
	}
}

func TestChangePasswordRejected(t *testing.T) {
	t.Run("неверный текущий пароль", func(t *testing.T) {
		module, d := newModule(t)
		d.expectTx()
		d.users.EXPECT().GetByID(inTx, userID).Return(user(), nil)
		d.passwords.EXPECT().ComparePassword("old-password", passwordHash).Return(false, nil)
		requireCode(t, module.ChangePassword.Execute(context.Background(), string(userID), passwords), domain.WrongPassword)
	})
	t.Run("новый совпадает с текущим", func(t *testing.T) {
		module, d := newModule(t)
		d.expectTx()
		d.users.EXPECT().GetByID(inTx, userID).Return(user(), nil)
		d.passwords.EXPECT().ComparePassword(gomock.Any(), passwordHash).Return(true, nil).Times(2)
		requireCode(t, module.ChangePassword.Execute(context.Background(), string(userID), passwords), domain.PasswordSameAsOld)
	})
	// Пользователя удалили, а access-токен ещё жив — 401, а не 404
	t.Run("нет пользователя", func(t *testing.T) {
		module, d := newModule(t)
		d.expectTx()
		d.users.EXPECT().GetByID(inTx, userID).Return(nil, domain.ErrEntityNotFound(0, nil))
		requireCode(t, module.ChangePassword.Execute(context.Background(), string(userID), passwords), domain.AccessTokenWrong)
	})
}
