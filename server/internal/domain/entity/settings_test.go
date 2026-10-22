package entity_test

import (
	"testing"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
)

func TestNewServiceURL(t *testing.T) {
	for raw, want := range map[string]string{
		"https://example.com/tasktrail/": "https://example.com/tasktrail",
		"https://example.com//":          "https://example.com",
		"http://localhost:3000":          "http://localhost:3000",
	} {
		if got := entity.NewServiceURL(raw); got != want {
			t.Errorf("%q: %q, ожидалось %q", raw, got, want)
		}
	}
}

func mailWithLogin(host string, port int, password *string) *entity.MailSettings {
	username := "robot"
	return &entity.MailSettings{Host: host, Port: port, Encryption: entity.MailEncryptionSTARTTLS, Sender: "a@b.c", Username: &username, Password: password}
}

// Сохранённый пароль уходит только на тот сервер и порт, для которых его ввели (ADR-0015).
func TestKeepPassword(t *testing.T) {
	saved := "smtp-password"
	t.Run("тот же сервер и порт", func(t *testing.T) {
		mail := mailWithLogin("SMTP.example.com", 587, nil)
		if err := mail.KeepPassword(mailWithLogin("smtp.example.com", 587, &saved)); err != nil {
			t.Fatal(err)
		}
		if mail.Password == nil || *mail.Password != saved {
			t.Fatalf("пароль %v", mail.Password)
		}
	})
	for name, previous := range map[string]*entity.MailSettings{
		"почта не подключена": nil,
		"пароль не сохранён":  mailWithLogin("smtp.example.com", 587, nil),
		"другой сервер":       mailWithLogin("smtp.evil.com", 587, &saved),
		"другой порт":         mailWithLogin("smtp.example.com", 465, &saved),
	} {
		t.Run(name, func(t *testing.T) {
			mail := mailWithLogin("smtp.example.com", 587, nil)
			if err := mail.KeepPassword(previous); !domain.HasCode(err, domain.SecretRequired) {
				t.Fatalf("ошибка %v, ожидалась SECRET_REQUIRED", err)
			}
			if mail.Password != nil {
				t.Fatal("пароль взят")
			}
		})
	}
	t.Run("без входа", func(t *testing.T) {
		mail := &entity.MailSettings{Host: "smtp.evil.com", Port: 25}
		if err := mail.KeepPassword(mailWithLogin("smtp.example.com", 587, &saved)); err != nil || mail.Password != nil {
			t.Fatalf("пароль %v, ошибка %v", mail.Password, err)
		}
	})
}
