package v1_test

import (
	"net"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	"task-trail/test/apitest"
	"task-trail/test/contract"
	"task-trail/test/smtptest"
)

const newPassword = "password-2"

// resetLink находит в письме ссылку сброса от адреса сервиса и возвращает её токен.
func resetLink(t *testing.T, text string) string {
	t.Helper()
	const prefix = "https://example.com/tasktrail/auth/reset?token="
	start := strings.Index(text, prefix)
	if start < 0 {
		t.Fatalf("в письме нет ссылки %s:\n%s", prefix, text)
	}
	link, _, _ := strings.Cut(text[start:], "\n")
	u, err := url.Parse(strings.TrimSpace(link))
	if err != nil {
		t.Fatal(err)
	}
	return u.Query().Get("token")
}

// withMail поднимает SMTP для теста и подключает к нему почту сервера.
func withMail(s *apitest.Server, t *testing.T) *smtptest.Server {
	smtp := smtptest.New(t)
	s.SaveMail(smtp.Settings())
	return smtp
}

// Письмо со ссылкой уходит сразу; по ссылке задаётся новый пароль, все сессии закрываются,
// а второй раз ссылка не срабатывает.
func TestResetPasswordByMail(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	oldRT := s.Cookie("rt", "/v1/auth/refresh")
	smtp := withMail(s, t)

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/forgot", map[string]string{"email": " Admin@Example.com "}), http.StatusNoContent)
	msg := smtp.Last(t)
	if len(msg.To) != 1 || msg.To[0] != "admin@example.com" {
		t.Fatalf("письмо ушло %v", msg.To)
	}
	token := resetLink(t, msg.Text(t))

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/reset", map[string]string{"token": token, "password": newPassword}), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil, rtCookie(oldRT)), http.StatusUnauthorized, "UNAUTHENTICATED")
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/login", map[string]string{"email": "admin@example.com", "password": password}),
		http.StatusUnauthorized, "INVALID_CREDENTIALS")
	login(t, s, "admin@example.com", newPassword)

	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/reset", map[string]string{"token": token, "password": "password-3"}),
		http.StatusUnprocessableEntity, "LINK_INVALID")
}

// Сброс по одной ссылке гасит и другие ссылки того же пользователя.
func TestResetPasswordRevokesOtherLinks(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	smtp := withMail(s, t)
	body := map[string]string{"email": "admin@example.com"}
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/forgot", body), http.StatusNoContent)
	first := resetLink(t, smtp.Last(t).Text(t))
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/forgot", body), http.StatusNoContent)
	second := resetLink(t, smtp.Last(t).Text(t))

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/reset", map[string]string{"token": second, "password": newPassword}), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/reset", map[string]string{"token": first, "password": "password-3"}),
		http.StatusUnprocessableEntity, "LINK_INVALID")
}

func TestResetLinkExpires(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	smtp := withMail(s, t)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/forgot", map[string]string{"email": "admin@example.com"}), http.StatusNoContent)
	token := resetLink(t, smtp.Last(t).Text(t))
	if !strings.Contains(smtp.Last(t).Text(t), "24 часа") {
		t.Fatal("в письме нет срока ссылки")
	}

	s.Clock.Advance(24 * time.Hour)
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/reset", map[string]string{"token": token, "password": newPassword}),
		http.StatusUnprocessableEntity, "LINK_INVALID")
}

func TestForgotPasswordWithoutLetter(t *testing.T) {
	// Без почты ссылку выдаёт администратор (ADR-0017)
	t.Run("почта не подключена", func(t *testing.T) {
		s := apitest.New(t, contract.Load(t))
		registerAdmin(t, s)
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/forgot", map[string]string{"email": "admin@example.com"}),
			http.StatusConflict, "MAIL_DISABLED")
	})
	t.Run("почта не зарегистрирована", func(t *testing.T) {
		s := apitest.New(t, contract.Load(t))
		registerAdmin(t, s)
		smtp := withMail(s, t)
		apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/forgot", map[string]string{"email": "nobody@example.com"}), http.StatusNoContent)
		if n := len(smtp.Messages()); n != 0 {
			t.Fatalf("писем: %d", n)
		}
	})
	// Письмо не ушло — ошибка в ответе, а не только в логе (ADR-0017)
	t.Run("SMTP недоступен", func(t *testing.T) {
		s := apitest.New(t, contract.Load(t))
		registerAdmin(t, s)
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		settings := smtptest.New(t).Settings()
		settings.Port = listener.Addr().(*net.TCPAddr).Port
		_ = listener.Close()
		s.SaveMail(settings)
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/forgot", map[string]string{"email": "admin@example.com"}),
			http.StatusBadGateway, "MAIL_SEND_FAILED")
	})
}

func TestPasswordResetValidation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	cases := []struct {
		name, path, body, field string
	}{
		{"почта", "/v1/auth/password/forgot", `{"email":"not-an-email"}`, "email"},
		{"нет токена", "/v1/auth/password/reset", `{"password":"password-1"}`, "token"},
		{"короткий пароль", "/v1/auth/password/reset", `{"token":"x","password":"1234567"}`, "password"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			body := apitest.RequireError(t, s.Do(http.MethodPost, c.path, c.body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
			if _, ok := body.Details[c.field]; !ok {
				t.Errorf("в details нет %q: %v", c.field, body.Details)
			}
		})
	}
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/reset", map[string]string{"token": "unknown", "password": newPassword}),
		http.StatusUnprocessableEntity, "LINK_INVALID")
}
