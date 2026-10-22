package middleware_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/middleware"
	"task-trail/test/clock"
	"task-trail/test/contract"

	"github.com/gin-gonic/gin"
)

type nopLogger struct{}

func (nopLogger) Debug(string, ...any) {}
func (nopLogger) Info(string, ...any)  {}
func (nopLogger) Warn(string, ...any)  {}
func (nopLogger) Error(string, ...any) {}

type changePasswordReq struct {
	OldPassword string `json:"oldPassword" binding:"required,min=8"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

// engine builds the engine like the server does and mounts handler on a path from the contract.
func engine(method, path string, handler gin.HandlerFunc) *gin.Engine {
	gin.SetMode(gin.TestMode)
	e := gin.New()
	middleware.Setup(e, id.New(), contextmanager.NewGin("at", "rt", "", clock.New(time.Now())), nopLogger{})
	e.Handle(method, path, handler)
	return e
}

func failWith(err error) gin.HandlerFunc {
	return func(c *gin.Context) { _ = c.Error(err) }
}

func serve(t *testing.T, e *gin.Engine, method, path, body string) (*http.Request, *httptest.ResponseRecorder) {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	return req, rec
}

func decode(t *testing.T, rec *httptest.ResponseRecorder) (code string, details map[string]string) {
	t.Helper()
	var body struct {
		Code    string            `json:"code"`
		Details map[string]string `json:"details"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("response is not JSON: %v, body %q", err, rec.Body.String())
	}
	return body.Code, body.Details
}

// An unparsable, expired or foreign token is a client error: 401 UNAUTHENTICATED, not 500.
func TestTokenErrorsAreUnauthenticated(t *testing.T) {
	v := contract.Load(t)
	for _, code := range []domain.ErrorCode{
		domain.ParseTokenFailed,
		domain.AccessTokenNotFound,
		domain.AccessTokenWrong,
		domain.AccessTokenExpired,
		domain.RefreshTokenWrong,
		domain.RefreshTokenExpired,
	} {
		t.Run(string(code), func(t *testing.T) {
			e := engine(http.MethodGet, "/v1/users/me", failWith(domain.NewErr(0, code, nil)))
			req, rec := serve(t, e, http.MethodGet, "/v1/users/me", "")
			if got, _ := decode(t, rec); rec.Code != http.StatusUnauthorized || got != "UNAUTHENTICATED" {
				t.Errorf("response %d %s, expected 401 UNAUTHENTICATED", rec.Code, got)
			}
			v.Check(t, req, rec)
		})
	}
}

// An error without its own response and a non-domain error are 500 INTERNAL in the contract format.
func TestUnknownErrorsAreInternal(t *testing.T) {
	v := contract.Load(t)
	for name, err := range map[string]error{
		"repository error":   domain.ErrRepoInternal(0, errors.New("connection reset")),
		"not a domain error": errors.New("boom"),
	} {
		t.Run(name, func(t *testing.T) {
			e := engine(http.MethodGet, "/v1/users/me", failWith(err))
			req, rec := serve(t, e, http.MethodGet, "/v1/users/me", "")
			if got, _ := decode(t, rec); rec.Code != http.StatusInternalServerError || got != "INTERNAL" {
				t.Errorf("response %d %s, expected 500 INTERNAL", rec.Code, got)
			}
			v.Check(t, req, rec)
		})
	}
}

func TestPanicIsInternal(t *testing.T) {
	v := contract.Load(t)
	e := engine(http.MethodGet, "/v1/users/me", func(*gin.Context) { panic("boom") })
	req, rec := serve(t, e, http.MethodGet, "/v1/users/me", "")
	if got, _ := decode(t, rec); rec.Code != http.StatusInternalServerError || got != "INTERNAL" {
		t.Errorf("response %d %s, expected 500 INTERNAL", rec.Code, got)
	}
	v.Check(t, req, rec)
}

// The details keys are field names from the request JSON, as the contract promises.
func TestValidationDetails(t *testing.T) {
	v := contract.Load(t)
	bind := func(c *gin.Context) {
		var body changePasswordReq
		if err := c.ShouldBindJSON(&body); err != nil {
			_ = c.Error(domain.ErrInputValidation(0, err))
			return
		}
		c.Status(http.StatusNoContent)
	}
	cases := []struct {
		name  string
		body  string
		field string
	}{
		{"short password", `{"oldPassword":"12345678","newPassword":"123"}`, "newPassword"},
		{"missing field", `{"oldPassword":"12345678"}`, "newPassword"},
		{"unknown field", `{"oldPassword":"12345678","newPassword":"12345678","x":1}`, "x"},
		{"wrong type", `{"oldPassword":"12345678","newPassword":42}`, "newPassword"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			e := engine(http.MethodPost, "/v1/auth/password/change", bind)
			req, rec := serve(t, e, http.MethodPost, "/v1/auth/password/change", c.body)
			code, details := decode(t, rec)
			if rec.Code != http.StatusUnprocessableEntity || code != "VALIDATION_FAILED" {
				t.Fatalf("response %d %s, expected 422 VALIDATION_FAILED", rec.Code, code)
			}
			if _, ok := details[c.field]; !ok {
				t.Errorf("details lack %q: %v", c.field, details)
			}
			v.Check(t, req, rec)
		})
	}
}

func TestUnknownPathIsNotFound(t *testing.T) {
	e := engine(http.MethodGet, "/v1/users/me", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	_, rec := serve(t, e, http.MethodGet, "/v1/nope", "")
	if got, _ := decode(t, rec); rec.Code != http.StatusNotFound || got != "NOT_FOUND" {
		t.Errorf("response %d %s, expected 404 NOT_FOUND", rec.Code, got)
	}
}
