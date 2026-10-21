package contextmanager_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"task-trail/internal/domain/service"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/test/clock"

	"github.com/gin-gonic/gin"
)

func cookies(rec *httptest.ResponseRecorder) map[string]*http.Cookie {
	out := map[string]*http.Cookie{}
	for _, cookie := range rec.Result().Cookies() {
		out[cookie.Name+" "+cookie.Path] = cookie
	}
	return out
}

// Срок жизни cookie отсчитывается от часов сервера (ADR-0022), пути — от префикса API;
// cookie refresh-токена старого API удаляется, иначе она заслонит новую.
func TestSetTokens(t *testing.T) {
	gin.SetMode(gin.TestMode)
	now := time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)
	m := contextmanager.NewGin("at", "rt", "/api", clock.New(now))
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)

	m.SetTokens(c,
		service.IssuedToken{Token: "access", ExpiredAt: now.Add(15 * time.Minute)},
		service.IssuedToken{Token: "refresh", ExpiredAt: now.Add(time.Hour)},
	)

	got := cookies(rec)
	if at := got["at /api/"]; at == nil || at.Value != "access" || at.MaxAge != 15*60 || !at.Secure || !at.HttpOnly || at.SameSite != http.SameSiteLaxMode {
		t.Errorf("cookie at: %+v", at)
	}
	if rt := got["rt /api/v1/auth/"]; rt == nil || rt.Value != "refresh" || rt.MaxAge != 60*60 {
		t.Errorf("cookie rt: %+v", rt)
	}
	if legacy := got["rt /api/v1/auth/refresh"]; legacy == nil || legacy.MaxAge >= 0 {
		t.Errorf("cookie rt старого API не удалена: %+v", legacy)
	}
}

func TestDeleteTokens(t *testing.T) {
	gin.SetMode(gin.TestMode)
	m := contextmanager.NewGin("at", "rt", "", clock.New(time.Now()))
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)

	m.DeleteTokens(c)

	got := cookies(rec)
	for _, key := range []string{"at /", "rt /v1/auth/", "rt /v1/auth/refresh"} {
		if cookie := got[key]; cookie == nil || cookie.MaxAge >= 0 {
			t.Errorf("cookie %q не удалена: %+v", key, cookie)
		}
	}
}
