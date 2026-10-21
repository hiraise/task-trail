package contextmanager_test

import (
	"net/http/httptest"
	"testing"
	"time"

	"task-trail/internal/domain/service"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/test/clock"

	"github.com/gin-gonic/gin"
)

// Срок жизни cookie токенов отсчитывается от часов сервера (ADR-0022), а не от time.Now.
func TestSetTokensMaxAgeFollowsClock(t *testing.T) {
	gin.SetMode(gin.TestMode)
	now := time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)
	m := contextmanager.NewGin("at", "rt", clock.New(now))
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)

	m.SetTokens(c,
		service.IssuedToken{Token: "access", ExpiredAt: now.Add(15 * time.Minute)},
		service.IssuedToken{Token: "refresh", ExpiredAt: now.Add(time.Hour)},
		"/v1/auth/",
	)

	maxAge := map[string]int{}
	for _, cookie := range rec.Result().Cookies() {
		maxAge[cookie.Name] = cookie.MaxAge
	}
	if maxAge["at"] != 15*60 || maxAge["rt"] != 60*60 {
		t.Fatalf("Max-Age cookie: %v, ожидалось at=900, rt=3600", maxAge)
	}
}
