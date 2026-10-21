package middleware

import (
	"net/http"
	"testing"

	"task-trail/internal/domain"
)

type nopLogger struct{}

func (nopLogger) Debug(string, ...any) {}
func (nopLogger) Info(string, ...any)  {}
func (nopLogger) Warn(string, ...any)  {}
func (nopLogger) Error(string, ...any) {}

// Неразборчивый токен — такая же ошибка клиента, как просроченный или чужой: 401, а не 500.
func TestTokenErrorsAreUnauthorized(t *testing.T) {
	codes := []domain.ErrorCode{
		domain.ParseTokenFailed,
		domain.AccessTokenWrong,
		domain.AccessTokenExpired,
		domain.RefreshTokenWrong,
		domain.RefreshTokenExpired,
	}
	for _, code := range codes {
		apiErr := proccessDomainError(domain.NewErr(0, code, nil), nopLogger{}, "request")
		if apiErr.Status != http.StatusUnauthorized {
			t.Errorf("%s: статус %d, ожидался %d", code, apiErr.Status, http.StatusUnauthorized)
		}
	}
}
