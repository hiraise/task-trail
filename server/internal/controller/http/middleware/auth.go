package middleware

import (
	"task-trail/internal/customerrors"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/token"

	"github.com/gin-gonic/gin"
)

// authenticate request, with validation access token
func NewAuth(
	t token.Service,
	errHandler customerrors.ErrorHandler,
	m contextmanager.Gin,
	atName string,
) gin.HandlerFunc {
	return func(c *gin.Context) {

		at, err := c.Cookie("at")
		if err != nil {
			_ = c.Error(errHandler.Unauthorized(err, "access token not found"))
			c.Abort()
			return
		}
		userId, err := t.VerifyAccessToken(at)
		if err != nil {
			_ = c.Error(errHandler.Unauthorized(err, "invalid access token"))
			m.DeleteAccessToken(c, atName)
			c.Abort()
			return
		}
		m.SetUserID(c, userId)
	}
}
