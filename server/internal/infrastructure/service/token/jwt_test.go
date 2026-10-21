package token_test

import (
	"errors"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/infrastructure/service/token"

	"github.com/golang-jwt/jwt/v5"
)

const (
	atSecret = "access-secret"
	rtSecret = "refresh-secret"
	issuer   = "test"
)

func sign(t *testing.T, secret string, claims jwt.MapClaims) string {
	t.Helper()
	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("подпись токена: %v", err)
	}
	return signed
}

func requireCode(t *testing.T, err error, code domain.ErrorCode) {
	t.Helper()
	var domainErr *domain.DomainError
	if !errors.As(err, &domainErr) || domainErr.Code != code {
		t.Fatalf("ожидалась ошибка %s, получено %v", code, err)
	}
}

// Токен с нашей подписью, но без строкового sub или jti раньше ронял обработчик паникой
// в domain.NewErr; теперь это ошибка PARSE_TOKEN_FAILED.
func TestVerifyTokenWithBrokenClaims(t *testing.T) {
	service := token.New([]byte(atSecret), time.Minute, []byte(rtSecret), issuer, id.New())
	exp := time.Now().Add(time.Minute).Unix()

	_, err := service.VerifyAccessToken(sign(t, atSecret, jwt.MapClaims{"exp": exp, "iss": issuer}))
	requireCode(t, err, domain.ParseTokenFailed)

	_, err = service.VerifyAccessToken(sign(t, atSecret, jwt.MapClaims{"exp": exp, "sub": 42}))
	requireCode(t, err, domain.ParseTokenFailed)

	_, _, err = service.VerifyRefreshToken(sign(t, rtSecret, jwt.MapClaims{"exp": exp, "sub": "user"}))
	requireCode(t, err, domain.ParseTokenFailed)
}

func TestVerifyValidTokens(t *testing.T) {
	service := token.New([]byte(atSecret), time.Minute, []byte(rtSecret), issuer, id.New())
	exp := time.Now().Add(time.Minute).Unix()

	userID, err := service.VerifyAccessToken(sign(t, atSecret, jwt.MapClaims{"exp": exp, "sub": "user"}))
	if err != nil || userID != "user" {
		t.Fatalf("access-токен: получено %q, %v", userID, err)
	}

	userID, jti, err := service.VerifyRefreshToken(sign(t, rtSecret, jwt.MapClaims{"exp": exp, "sub": "user", "jti": "token"}))
	if err != nil || userID != "user" || jti != "token" {
		t.Fatalf("refresh-токен: получено %q, %q, %v", userID, jti, err)
	}
}
