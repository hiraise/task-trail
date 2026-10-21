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

// Команда печатает ссылку сброса для любой почты — тому, кто управляет сервером (ADR-0017);
// по ссылке пароль меняется так же, как по ссылке из письма.
func TestPasswordResetLinkCommand(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	rec := s.Do(http.MethodPost, "/v1/auth/register", map[string]string{
		"email": "admin@example.com", "password": "password-1", "username": "Админ", "serviceUrl": "https://example.com/tasktrail",
	})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	cfg := &config.Config{App: config.App{Secret: apitest.Secret}, PG: config.PG{ConnString: s.Pool.Config().ConnString()}}

	// Gin в режиме отладки печатает маршруты в stdout процесса — в тесте это тот же буфер.
	// Команда режим отладки выключает: в stdout — только ссылка
	var stdout, stderr bytes.Buffer
	gin.SetMode(gin.DebugMode)
	previous := gin.DefaultWriter
	gin.DefaultWriter = &stdout
	t.Cleanup(func() { gin.DefaultWriter = previous })
	if code := app.Command(cfg, []string{"password-reset-link", " Admin@Example.com"}, &stdout, &stderr); code != 0 {
		t.Fatalf("код %d: %s", code, stderr.String())
	}
	link, rest, _ := strings.Cut(stdout.String(), "\n")
	if !strings.HasPrefix(link, "https://example.com/tasktrail/auth/reset?token=") || rest != "" ||
		!strings.Contains(stderr.String(), "Ссылка действует до") {
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
		"нет пользователя": {"password-reset-link", "nobody@example.com"},
		"нет почты":        {"password-reset-link"},
		"нет команды":      {"unknown"},
	}
	for name, args := range cases {
		t.Run(name, func(t *testing.T) {
			var stdout, stderr bytes.Buffer
			if code := app.Command(cfg, args, &stdout, &stderr); code == 0 || stdout.Len() != 0 || stderr.Len() == 0 {
				t.Fatalf("код %d, stdout %q, stderr %q", code, stdout.String(), stderr.String())
			}
		})
	}
}
