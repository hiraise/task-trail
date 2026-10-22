package app_test

import (
	"bytes"
	"net/http"
	"net/url"
	"strings"
	"testing"

	"task-trail/config"
	"task-trail/internal/app"
	"task-trail/test/apitest"
	"task-trail/test/contract"

	"github.com/gin-gonic/gin"
)

// The command prints a reset link for any email — to whoever manages the server (ADR-0017);
// the link changes the password the same way as a link from a letter.
func TestPasswordResetLinkCommand(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	rec := s.Do(http.MethodPost, "/v1/auth/register", map[string]string{
		"email": "admin@example.com", "password": "password-1", "username": "Админ", "serviceUrl": "https://example.com/tasktrail",
	})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	cfg := &config.Config{App: config.App{Secret: apitest.Secret}, PG: config.PG{ConnString: s.Pool.Config().ConnString()}}

	// Gin in debug mode prints routes to the process stdout — in the test it is the same buffer.
	// The command turns debug mode off: stdout holds only the link
	var stdout, stderr bytes.Buffer
	gin.SetMode(gin.DebugMode)
	previous := gin.DefaultWriter
	gin.DefaultWriter = &stdout
	t.Cleanup(func() { gin.DefaultWriter = previous })
	if code := app.Command(cfg, []string{"password-reset-link", " Admin@Example.com"}, &stdout, &stderr); code != 0 {
		t.Fatalf("code %d: %s", code, stderr.String())
	}
	link, rest, _ := strings.Cut(stdout.String(), "\n")
	if !strings.HasPrefix(link, "https://example.com/tasktrail/auth/reset?token=") || rest != "" ||
		!strings.Contains(stderr.String(), "The link is valid until") {
		t.Fatalf("stdout %q, stderr %q", stdout.String(), stderr.String())
	}
	u, err := url.Parse(link)
	if err != nil {
		t.Fatal(err)
	}
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/reset", map[string]string{"token": u.Query().Get("token"), "password": "password-2"}),
		http.StatusNoContent)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/login", map[string]string{"email": "admin@example.com", "password": "password-2"}),
		http.StatusOK)
}

func TestPasswordResetLinkCommandErrors(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	cfg := &config.Config{App: config.App{Secret: apitest.Secret}, PG: config.PG{ConnString: s.Pool.Config().ConnString()}}
	cases := map[string][]string{
		"no user":    {"password-reset-link", "nobody@example.com"},
		"no email":   {"password-reset-link"},
		"no command": {"unknown"},
	}
	for name, args := range cases {
		t.Run(name, func(t *testing.T) {
			var stdout, stderr bytes.Buffer
			if code := app.Command(cfg, args, &stdout, &stderr); code == 0 || stdout.Len() != 0 || stderr.Len() == 0 {
				t.Fatalf("code %d, stdout %q, stderr %q", code, stdout.String(), stderr.String())
			}
		})
	}
}
