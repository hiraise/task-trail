package token_test

import (
	"errors"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/infrastructure/service/token"
	"task-trail/test/clock"

	"github.com/golang-jwt/jwt/v5"
)

const (
	atSecret = "access-secret"
	rtSecret = "refresh-secret"
	issuer   = "test"
)

var start = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

func newService(c *clock.Fixed) *token.JWTTokenService {
	return token.New([]byte(atSecret), time.Minute, []byte(rtSecret), issuer, id.New(), c)
}

func sign(t *testing.T, secret string, claims jwt.MapClaims) string {
	t.Helper()
	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("signing the token: %v", err)
	}
	return signed
}

func requireCode(t *testing.T, err error, code domain.ErrorCode) {
	t.Helper()
	var domainErr *domain.DomainError
	if !errors.As(err, &domainErr) || domainErr.Code != code {
		t.Fatalf("expected error %s, got %v", code, err)
	}
}

// A token with our signature but without a string sub or jti used to crash the handler with a panic
// in domain.NewErr; now it is a PARSE_TOKEN_FAILED error.
func TestVerifyTokenWithBrokenClaims(t *testing.T) {
	service := newService(clock.New(start))
	exp := start.Add(time.Minute).Unix()

	_, err := service.VerifyAccessToken(sign(t, atSecret, jwt.MapClaims{"exp": exp, "iss": issuer}))
	requireCode(t, err, domain.ParseTokenFailed)

	_, err = service.VerifyAccessToken(sign(t, atSecret, jwt.MapClaims{"exp": exp, "sub": 42}))
	requireCode(t, err, domain.ParseTokenFailed)

	_, _, err = service.VerifyRefreshToken(sign(t, rtSecret, jwt.MapClaims{"exp": exp, "sub": "user"}))
	requireCode(t, err, domain.ParseTokenFailed)
}

func TestVerifyValidTokens(t *testing.T) {
	service := newService(clock.New(start))
	exp := start.Add(time.Minute).Unix()

	userID, err := service.VerifyAccessToken(sign(t, atSecret, jwt.MapClaims{"exp": exp, "sub": "user"}))
	if err != nil || userID != "user" {
		t.Fatalf("access token: got %q, %v", userID, err)
	}

	userID, jti, err := service.VerifyRefreshToken(sign(t, rtSecret, jwt.MapClaims{"exp": exp, "sub": "user", "jti": "token"}))
	if err != nil || userID != "user" || jti != "token" {
		t.Fatalf("refresh token: got %q, %q, %v", userID, jti, err)
	}
}

// Token expiry follows the server clock (ADR-0022): both when issuing and when verifying.
func TestTokenLifetimeFollowsClock(t *testing.T) {
	c := clock.New(start)
	service := newService(c)

	at, err := service.GenerateAccessToken("user")
	if err != nil {
		t.Fatalf("issuing the access token: %v", err)
	}
	if !at.ExpiredAt.Equal(start.Add(time.Minute)) {
		t.Fatalf("access token expiry %v, expected %v", at.ExpiredAt, start.Add(time.Minute))
	}
	rt, err := service.GenerateRefreshToken("user", &entity.RefreshToken{ID: "token", ExpiredAt: start.Add(time.Hour)})
	if err != nil {
		t.Fatalf("issuing the refresh token: %v", err)
	}

	c.Advance(59 * time.Second)
	if _, err := service.VerifyAccessToken(at.Token); err != nil {
		t.Fatalf("access token before expiry: %v", err)
	}

	c.Advance(2 * time.Second)
	_, err = service.VerifyAccessToken(at.Token)
	requireCode(t, err, domain.AccessTokenExpired)

	c.Advance(time.Hour)
	_, _, err = service.VerifyRefreshToken(rt.Token)
	requireCode(t, err, domain.RefreshTokenExpired)
}
