package middleware

import (
	"runtime"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/logger"

	"github.com/gin-gonic/gin"
)

const sourceCodeOffset = 4

// recover server after panic
func NewRecovery(l logger.Logger, m contextmanager.Gin) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				// TODO: refactor
				pc, file, line, _ := runtime.Caller(sourceCodeOffset)
				fn := runtime.FuncForPC(pc)
				path := map[string]any{
					"file":     file,
					"function": fn.Name(),
					"line":     line,
				}
				l.Error(
					"panic recovered",
					"error", r,
					"path", c.Request.URL.Path,
					"method", c.Request.Method,
					"client_ip", c.ClientIP(),
					"source", path,
					"userID", m.GetUserID(c),
					"reqID", m.GetRequestID(c),
				)
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}
