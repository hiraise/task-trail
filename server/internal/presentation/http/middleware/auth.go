package middleware

import (
	"task-trail/internal/domain"
	"task-trail/internal/domain/service"
	"task-trail/internal/pkg/contextmanager"

	"github.com/gin-gonic/gin"
)

// authenticate request, with validation access token
func NewAuth(
	ts service.AccessTokenService,
	m *contextmanager.GinContextManager,
) gin.HandlerFunc {
	return func(c *gin.Context) {

		at, err := c.Cookie(m.ATName)
		if err != nil {
			_ = c.Error(domain.ErrAccessTokenNotFound())
			c.Abort()
			return
		}
		userID, err := ts.VerifyAccessToken(at)
		if err != nil {
			_ = c.Error(err)
			m.DeleteAccessToken(c, m.ATName)
			c.Abort()
			return
		}
		m.SetUserID(c, userID)
	}
}
