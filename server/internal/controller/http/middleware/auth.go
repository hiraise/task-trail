package middleware

import (
	"net/http"
	customerrors "task-trail/error"
	"task-trail/internal/pkg/token"

	"github.com/gin-gonic/gin"
)

func AuthHandler(t token.Service) gin.HandlerFunc {
	return func(c *gin.Context) {

		at, err := c.Cookie("at")
		if err != nil {
			e := customerrors.NewErrUnauthorized(nil)
			c.AbortWithStatusJSON(e.Status, e)
			c.Errors = nil
			return
		}
		userId, err := t.VerifyAccessToken(at)
		if err != nil {
			e := customerrors.NewErrUnauthorized(nil)
			// TODO: replace to helper for delete cookie
			c.SetSameSite(http.SameSiteLaxMode)
			c.SetCookie("at", "", -1, "/", "/", true, true)
			c.AbortWithStatusJSON(e.Status, e)
			c.Errors = nil
			return
		}
		c.Set("userId", userId)
		c.Next()
	}
}
