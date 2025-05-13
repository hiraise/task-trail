package middleware

import (
	"log/slog"
	"runtime"
	"task-trail/pkg/logger"

	"github.com/gin-gonic/gin"
)

func RecoveryWithLogger(l logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				// TODO: refactor
				pc, file, line, _ := runtime.Caller(2)
				fn := runtime.FuncForPC(pc)
				path := map[string]any{
					"file":     file,
					"function": fn.Name(),
					"line":     line,
				}
				l.Error("panic recovered",
					slog.Any("error", r),
					slog.String("path", c.Request.URL.Path),
					slog.String("method", c.Request.Method),
					slog.String("client_ip", c.ClientIP()),
					slog.Any("source", path),
				)
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}
