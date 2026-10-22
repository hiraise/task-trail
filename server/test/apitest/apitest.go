// Package apitest собирает сервер так же, как internal/app, на временной базе (test/testdb)
// с фиксированными часами (ADR-0022) и ходит в него запросами, как браузер: с cookie
// по их путям. Каждый ответ сверяется с контрактом (ADR-0019).
package apitest

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"task-trail/config"
	"task-trail/internal/app"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/infrastructure/service/keys"
	"task-trail/internal/infrastructure/service/linktoken"
	"task-trail/internal/infrastructure/service/secretbox"
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
	// App — модули сервера: тест вызывает то, что сервер делает по расписанию, например очистку.
	App   *app.Server
	Clock *clock.Fixed
	Pool  *pgxpool.Pool
	// FilesDir — папка файлов сервера (FILES_DIR), своя у каждого теста.
	FilesDir string
	// Jar — cookie «браузера»: ответы их ставят и удаляют, запросы отправляют по пути.
	Jar http.CookieJar
}

type nopLogger struct{}

func (nopLogger) Debug(string, ...any) {}
func (nopLogger) Info(string, ...any)  {}
func (nopLogger) Warn(string, ...any)  {}
func (nopLogger) Error(string, ...any) {}

// New поднимает сервер на чистой базе. Контракт передаёт тест: contract.Load(t); opts —
// параметры сборки только для тестов, например app.WithSMTPRootCAs.
func New(t testing.TB, v *contract.Validator, opts ...app.Option) *Server {
	t.Helper()
	gin.SetMode(gin.TestMode)
	pool := testdb.New(t)
	clk := clock.New(Start)
	filesDir := t.TempDir()
	cfg := &config.Config{App: config.App{Secret: Secret, FilesDir: filesDir}}
	opts = append([]app.Option{app.WithPasswordHashCost(bcrypt.MinCost)}, opts...)
	srv, err := app.New(pool, cfg, clk, nopLogger{}, opts...)
	if err != nil {
		t.Fatalf("сборка сервера: %v", err)
	}
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	return &Server{t: t, contract: v, engine: srv.Engine, App: srv, Clock: clk, Pool: pool, FilesDir: filesDir, Jar: jar}
}

// Do отправляет запрос с cookie из Jar, сверяет ответ с контрактом и сохраняет новые cookie.
// body — значение для JSON, строка с готовым JSON или Multipart; replace — cookie, которые запрос
// отправит вместо одноимённых из Jar (например, старый refresh-токен).
func (s *Server) Do(method, path string, body any, replace ...*http.Cookie) *httptest.ResponseRecorder {
	s.t.Helper()
	req, rec := s.do(method, path, body, replace...)
	s.contract.Check(s.t, req, rec)
	return rec
}

// Get — GET с cookie из Jar для путей вне контракта, например Swagger по /docs/.
func (s *Server) Get(path string) *httptest.ResponseRecorder {
	s.t.Helper()
	_, rec := s.do(http.MethodGet, path, nil)
	return rec
}

// Part — поле multipart/form-data: файл, если задано FileName.
type Part struct {
	Name     string
	FileName string
	Content  []byte
}

// Multipart — тело multipart/form-data для Do.
type Multipart []Part

func (m Multipart) encode(t testing.TB) (io.Reader, string) {
	t.Helper()
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	for _, p := range m {
		var part io.Writer
		var err error
		if p.FileName != "" {
			part, err = w.CreateFormFile(p.Name, p.FileName)
		} else {
			part, err = w.CreateFormField(p.Name)
		}
		if err == nil {
			_, err = part.Write(p.Content)
		}
		if err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return &body, w.FormDataContentType()
}

func (s *Server) do(method, path string, body any, replace ...*http.Cookie) (*http.Request, *httptest.ResponseRecorder) {
	s.t.Helper()
	var reader io.Reader
	contentType := "application/json"
	switch b := body.(type) {
	case nil:
	case string:
		reader = bytes.NewBufferString(b)
	case Multipart:
		reader, contentType = b.encode(s.t)
	default:
		data, err := json.Marshal(b)
		if err != nil {
			s.t.Fatal(err)
		}
		reader = bytes.NewReader(data)
	}
	req := httptest.NewRequest(method, BaseURL+path, reader)
	if reader != nil {
		req.Header.Set("Content-Type", contentType)
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
	s.Jar.SetCookies(req.URL, rec.Result().Cookies())
	return req, rec
}

// SaveMail подключает почту, как это сделает администратор в интерфейсе (ADR-0017).
func (s *Server) SaveMail(settings *entity.MailSettings) {
	s.t.Helper()
	box, err := secretbox.New(keys.Derive(Secret, keys.SecretBox))
	if err != nil {
		s.t.Fatal(err)
	}
	if err := persistent.NewSettingsRepo(s.Pool, box).SaveMail(context.Background(), settings); err != nil {
		s.t.Fatal(err)
	}
}

// InvitationLifetime — срок приглашения (ADR-0016).
const InvitationLifetime = 7 * 24 * time.Hour

// CreateProject создаёт проект прямо в базе, без владельца и участников: тестам, которым нужен
// просто проект, API проектов с его проверками ролей ни к чему.
func (s *Server) CreateProject(name string) string {
	s.t.Helper()
	projectID := id.New().Generate()
	if _, err := s.Pool.Exec(context.Background(), `INSERT INTO projects (id, name) VALUES ($1, $2)`, projectID, name); err != nil {
		s.t.Fatal(err)
	}
	return projectID
}

// AddMember делает пользователя участником проекта прямо в базе, минуя проверки ролей API.
func (s *Server) AddMember(projectID, userID string, role entity.ProjectRole) {
	s.t.Helper()
	_, err := s.Pool.Exec(context.Background(),
		`INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`, projectID, userID, role)
	if err != nil {
		s.t.Fatal(err)
	}
}

// RemoveMember исключает пользователя из проекта прямо в базе, минуя проверки ролей API.
func (s *Server) RemoveMember(projectID, userID string) {
	s.t.Helper()
	_, err := s.Pool.Exec(context.Background(),
		`DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, projectID, userID)
	if err != nil {
		s.t.Fatal(err)
	}
}

// Invite приглашает email в проект от inviterID и возвращает токен ссылки. Приглашение
// пишется прямо в базу, без письма и проверки ролей, — как его создаёт POST /v1/projects/{id}/members.
func (s *Server) Invite(projectID, email, inviterID string) string {
	s.t.Helper()
	f := factory.NewInvitationFactory(id.New(), linktoken.New(), s.Clock, InvitationLifetime)
	token, invitation := f.New(entity.ProjectID(projectID), entity.NewEmail(email), entity.UserID(inviterID))
	if err := persistent.NewInvitationRepo(s.Pool).Create(context.Background(), invitation); err != nil {
		s.t.Fatal(err)
	}
	return token
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
