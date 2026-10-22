package access_test

import (
	"context"
	"testing"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"

	"go.uber.org/mock/gomock"
)

func TestPublicSettings(t *testing.T) {
	cases := []struct {
		name       string
		usersExist bool
		mail       *entity.MailSettings
		want       dto.PublicSettings
	}{
		{"новый сервис", false, nil, dto.PublicSettings{RegistrationOpen: true, MailEnabled: false}},
		{"почта подключена", true, &entity.MailSettings{Host: "smtp.example.com"}, dto.PublicSettings{RegistrationOpen: false, MailEnabled: true}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			module, d := newModule(t)
			d.users.EXPECT().Any(gomock.Any()).Return(c.usersExist, nil)
			d.settings.EXPECT().GetMail(gomock.Any()).Return(c.mail, nil)
			got, err := module.PublicSettings.Execute(context.Background())
			if err != nil || got != c.want {
				t.Fatalf("получено %+v, %v; ожидалось %+v", got, err, c.want)
			}
		})
	}
}

// Очистка удаляет истёкшие refresh-токены, ссылки сброса и приглашения и считает всё вместе.
func TestCleanupDeletesExpired(t *testing.T) {
	module, d := newModule(t)
	d.tokens.EXPECT().DeleteExpired(gomock.Any(), now).Return(int64(3), nil)
	d.resets.EXPECT().DeleteExpired(gomock.Any(), now).Return(int64(2), nil)
	d.invitations.EXPECT().DeleteExpired(gomock.Any(), now).Return(int64(1), nil)
	if deleted, err := module.Cleanup.Execute(context.Background()); err != nil || deleted != 6 {
		t.Fatalf("удалено %d, %v", deleted, err)
	}
}
