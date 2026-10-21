// Package apitest собирает сервер так же, как internal/app, на временной базе (test/testdb)
// с фиксированными часами (ADR-0022) и ходит в него запросами, как браузер: с cookie
// по их путям. Каждый ответ сверяется с контрактом (ADR-0019).
package apitest

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"task-trail/config"
	"task-trail/internal/app"
	"task-trail/test/clock"
	"task-trail/test/contract"
	"task-trail/test/testdb"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// BaseURL — адрес сервера в тестах: cookie сессии с флагом Secure браузер шлёт только по https.
const BaseURL = "https://tasktrail.test"

// Secret — APP_SECRET тестового сервера.
const Secret = "0123456789abcdef0123456789abcdef"

// Start — время на часах сервера в начале теста.
var Start = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

type Server struct {
	t        testing.TB
	contract *contract.Validator
	engine   *gin.Engine
	Clock    *clock.Fixed
	Pool     *pgxpool.Pool
	// Jar — cookie «браузера»: ответы их ставят и удаляют, запросы отправляют по пути.
	Jar http.CookieJar
}

type nopLogger struct{}

func (nopLogger) Debug(string, ...any) {}
func (nopLogger) Info(string, ...any)  {}
func (nopLogger) Warn(string, ...any)  {}
func (nopLogger) Error(string, ...any) {}

// New поднимает сервер на чистой базе. Контракт передаёт тест: contract.Load(t).
func New(t testing.TB, v *contract.Validator) *Server {
	t.Helper()
	gin.SetMode(gin.TestMode)
	pool := testdb.New(t)
	clk := clock.New(Start)
	srv, err := app.New(pool, &config.Config{App: config.App{Secret: Secret}}, clk, nopLogger{}, app.WithPasswordHashCost(bcrypt.MinCost))
	if err != nil {
		t.Fatalf("сборка сервера: %v", err)
	}
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	return &Server{t: t, contract: v, engine: srv.Engine, Clock: clk, Pool: pool, Jar: jar}
}

// Do отправляет запрос с cookie из Jar, сверяет ответ с контрактом и сохраняет новые cookie.
// body — значение для JSON или строка с готовым JSON; replace — cookie, которые запрос
// отправит вместо одноимённых из Jar (например, старый refresh-токен).
func (s *Server) Do(method, path string, body any, replace ...*http.Cookie) *httptest.ResponseRecorder {
	s.t.Helper()
	var reader io.Reader
	switch b := body.(type) {
	case nil:
	case string:
		reader = bytes.NewBufferString(b)
	default:
		data, err := json.Marshal(b)
		if err != nil {
			s.t.Fatal(err)
		}
		reader = bytes.NewReader(data)
	}
	req := httptest.NewRequest(method, BaseURL+path, reader)
	if reader != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	replaced := map[string]bool{}
	for _, c := range replace {
		replaced[c.Name] = true
		req.AddCookie(c)
	}
	for _, c := range s.Jar.Cookies(req.URL) {
		if !replaced[c.Name] {
			req.AddCookie(c)
		}
	}
	rec := httptest.NewRecorder()
	s.engine.ServeHTTP(rec, req)
	s.contract.Check(s.t, req, rec)
	s.Jar.SetCookies(req.URL, rec.Result().Cookies())
	return rec
}

// Cookie — значение cookie name, которое браузер отправит на path, или пустая строка.
func (s *Server) Cookie(name, path string) string {
	u, _ := url.Parse(BaseURL + path)
	for _, c := range s.Jar.Cookies(u) {
		if c.Name == name {
			return c.Value
		}
	}
	return ""
}

// Decode разбирает JSON-ответ в значение типа T.
func Decode[T any](t testing.TB, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var v T
	if err := json.Unmarshal(rec.Body.Bytes(), &v); err != nil {
		t.Fatalf("ответ не JSON: %v, тело %q", err, rec.Body.String())
	}
	return v
}

// Error — тело ApiError.
type Error struct {
	Code    string            `json:"code"`
	Details map[string]string `json:"details"`
}

// RequireError проверяет статус и код ошибки ответа.
func RequireError(t testing.TB, rec *httptest.ResponseRecorder, status int, code string) Error {
	t.Helper()
	body := Decode[Error](t, rec)
	if rec.Code != status || body.Code != code {
		t.Fatalf("ответ %d %s, ожидался %d %s; тело %s", rec.Code, body.Code, status, code, rec.Body.String())
	}
	return body
}

// RequireStatus проверяет статус ответа.
func RequireStatus(t testing.TB, rec *httptest.ResponseRecorder, status int) {
	t.Helper()
	if rec.Code != status {
		t.Fatalf("ответ %d, ожидался %d; тело %s", rec.Code, status, rec.Body.String())
	}
}
