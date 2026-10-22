// Package apitest builds the server the same way as internal/app, on a temporary database (test/testdb)
// with a fixed clock (ADR-0022), and sends requests to it like a browser: with cookies
// by their paths. Every response is checked against the contract (ADR-0019).
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

// BaseURL is the server address in tests: the browser sends a session cookie with the Secure flag only over https.
const BaseURL = "https://tasktrail.test"

// Secret is the APP_SECRET of the test server.
const Secret = "0123456789abcdef0123456789abcdef"

// Start is the time on the server clock at the start of the test.
var Start = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

type Server struct {
	t        testing.TB
	contract *contract.Validator
	engine   *gin.Engine
	// App is the server modules: the test calls what the server does on a schedule, such as cleanup.
	App   *app.Server
	Clock *clock.Fixed
	Pool  *pgxpool.Pool
	// FilesDir is the server's files folder (FILES_DIR), separate for each test.
	FilesDir string
	// Jar holds the "browser" cookies: responses set and delete them, requests send them by path.
	Jar http.CookieJar
}

type nopLogger struct{}

func (nopLogger) Debug(string, ...any) {}
func (nopLogger) Info(string, ...any)  {}
func (nopLogger) Warn(string, ...any)  {}
func (nopLogger) Error(string, ...any) {}

// New starts the server on a clean database. The test passes the contract: contract.Load(t); opts are
// test-only build options, such as app.WithSMTPRootCAs.
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
		t.Fatalf("building the server: %v", err)
	}
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	return &Server{t: t, contract: v, engine: srv.Engine, App: srv, Clock: clk, Pool: pool, FilesDir: filesDir, Jar: jar}
}

// Do sends a request with cookies from Jar, checks the response against the contract and stores new cookies.
// body is a value for JSON, a string with ready JSON, or Multipart; replace are cookies the request
// sends instead of the same-named ones from Jar (for example, an old refresh token).
func (s *Server) Do(method, path string, body any, replace ...*http.Cookie) *httptest.ResponseRecorder {
	s.t.Helper()
	req, rec := s.do(method, path, body, replace...)
	s.contract.Check(s.t, req, rec)
	return rec
}

// Get is a GET with cookies from Jar for paths outside the contract, such as Swagger at /docs/.
func (s *Server) Get(path string) *httptest.ResponseRecorder {
	s.t.Helper()
	_, rec := s.do(http.MethodGet, path, nil)
	return rec
}

// Part is a multipart/form-data field: a file if FileName is set.
type Part struct {
	Name     string
	FileName string
	Content  []byte
}

// Multipart is a multipart/form-data body for Do.
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

// SaveMail connects mail the way the administrator does it in the UI (ADR-0017).
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

// InvitationLifetime is the invitation lifetime (ADR-0016).
const InvitationLifetime = 7 * 24 * time.Hour

// CreateProject creates a project directly in the database, without an owner or members: tests that just
// need a project have no use for the projects API with its role checks.
func (s *Server) CreateProject(name string) string {
	s.t.Helper()
	projectID := id.New().Generate()
	if _, err := s.Pool.Exec(context.Background(), `INSERT INTO projects (id, name) VALUES ($1, $2)`, projectID, name); err != nil {
		s.t.Fatal(err)
	}
	return projectID
}

// AddMember makes the user a project member directly in the database, bypassing the API role checks.
func (s *Server) AddMember(projectID, userID string, role entity.ProjectRole) {
	s.t.Helper()
	_, err := s.Pool.Exec(context.Background(),
		`INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`, projectID, userID, role)
	if err != nil {
		s.t.Fatal(err)
	}
}

// RemoveMember removes the user from the project directly in the database, bypassing the API role checks.
func (s *Server) RemoveMember(projectID, userID string) {
	s.t.Helper()
	_, err := s.Pool.Exec(context.Background(),
		`DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, projectID, userID)
	if err != nil {
		s.t.Fatal(err)
	}
}

// Invite invites email to the project from inviterID and returns the link token. The invitation
// is written directly to the database, without an email or role checks — as POST /v1/projects/{id}/members creates it.
func (s *Server) Invite(projectID, email, inviterID string) string {
	s.t.Helper()
	f := factory.NewInvitationFactory(id.New(), linktoken.New(), s.Clock, InvitationLifetime)
	token, invitation := f.New(entity.ProjectID(projectID), entity.NewEmail(email), entity.UserID(inviterID))
	if err := persistent.NewInvitationRepo(s.Pool).Create(context.Background(), invitation); err != nil {
		s.t.Fatal(err)
	}
	return token
}

// Cookie is the value of cookie name that the browser will send to path, or an empty string.
func (s *Server) Cookie(name, path string) string {
	u, _ := url.Parse(BaseURL + path)
	for _, c := range s.Jar.Cookies(u) {
		if c.Name == name {
			return c.Value
		}
	}
	return ""
}

// Decode parses a JSON response into a value of type T.
func Decode[T any](t testing.TB, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var v T
	if err := json.Unmarshal(rec.Body.Bytes(), &v); err != nil {
		t.Fatalf("response is not JSON: %v, body %q", err, rec.Body.String())
	}
	return v
}

// Error is the ApiError body.
type Error struct {
	Code    string            `json:"code"`
	Details map[string]string `json:"details"`
}

// RequireError checks the status and the error code of the response.
func RequireError(t testing.TB, rec *httptest.ResponseRecorder, status int, code string) Error {
	t.Helper()
	body := Decode[Error](t, rec)
	if rec.Code != status || body.Code != code {
		t.Fatalf("response %d %s, expected %d %s; body %s", rec.Code, body.Code, status, code, rec.Body.String())
	}
	return body
}

// RequireStatus checks the response status.
func RequireStatus(t testing.TB, rec *httptest.ResponseRecorder, status int) {
	t.Helper()
	if rec.Code != status {
		t.Fatalf("response %d, expected %d; body %s", rec.Code, status, rec.Body.String())
	}
}
