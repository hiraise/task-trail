package middleware

import (
	customerrors "task-trail/error"
	"task-trail/internal/controller/http/helper"
	"task-trail/internal/pkg/token"
	"task-trail/pkg/logger"

	"github.com/gin-gonic/gin"
)

func AuthHandler(t token.Service, l logger.Logger, atName string) gin.HandlerFunc {
	return func(c *gin.Context) {

		at, err := c.Cookie("at")
		if err != nil {
			l.Warn("access token not found", "error", err.Error())
			abort(c)
			return
		}
		userId, err := t.VerifyAccessToken(at)
		if err != nil {
			l.Warn("invalid access token", "error", err.Error())
			helper.DeleteAccessToken(c, atName)
			abort(c)
			return
		}
		c.Set("userId", userId)
		c.Next()
	}
}

func abort(c *gin.Context) {
	e := customerrors.NewErrUnauthorized(nil)
	c.AbortWithStatusJSON(e.Status, e)
	c.Errors = nil
}
