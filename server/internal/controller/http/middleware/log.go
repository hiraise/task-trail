package middleware

import (
	"task-trail/pkg/logger"

	"github.com/gin-gonic/gin"
)

func CustomLogger(l logger.Logger) gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		args := []any{"status", param.StatusCode,
			"client_ip", param.ClientIP,
			"method", param.Method,
			"path", param.Path,
			"user_agent", param.Request.UserAgent(),
			"latency", param.Latency.String(),
		}

		userId, ok := param.Keys["userId"]
		if ok {
			args = append(args, "userId", userId.(int))
		}
		l.Info("http request", args...)
		return ""
	})
}
