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
			m.DeleteAccessToken(c)
			c.Abort()
			return
		}
		m.SetUserID(c, userID)
	}
}

// NewOptionalAuth signs the request in if it has a valid access token and lets a guest through otherwise:
// an avatar is served to everyone, an attachment only to members (ADR-0013, ADR-0037). An invalid cookie
// is not deleted: the web refreshes the session when an attachment answers 401.
func NewOptionalAuth(
	ts service.AccessTokenService,
	m *contextmanager.GinContextManager,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		at, err := c.Cookie(m.ATName)
		if err != nil {
			return
		}
		if userID, err := ts.VerifyAccessToken(at); err == nil {
			m.SetUserID(c, userID)
		}
	}
}
