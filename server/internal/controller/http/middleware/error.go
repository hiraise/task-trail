package middleware

import (
	"task-trail/internal/controller/http/v1/response"
	"task-trail/internal/customerrors"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/logger"

	"github.com/gin-gonic/gin"
)

// log err and return prepared response
func NewError(l logger.Logger, m contextmanager.Gin) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		for _, err := range c.Errors {
			switch e := err.Err.(type) {
			case *customerrors.Err:
				logError(e, l, m.GetRequestID(c))
				a := response.NewFromErrBase(e)
				c.AbortWithStatusJSON(a.Status, a)
			default:
				l.Error("unexpected error", "error", err)
				c.AbortWithStatusJSON(500, "unexpected error")
			}
		}

		// Cleanup error, beacause they already logged
		c.Errors = nil
	}
}

func logError(e *customerrors.Err, l logger.Logger, reqID any) {
	args := append(e.Data, "source", e.Source, "requestID", reqID, "error", e.Unwrap())
	switch e.Type {
	case customerrors.InvalidCredentialsErr:
		l.Warn(e.Msg, args...)
	case customerrors.UnauthorizedErr:
		l.Warn(e.Msg, args...)
	case customerrors.ValidationErr:
		l.Warn(e.Msg, args...)
	case customerrors.ConflictErr:
		l.Warn(e.Msg, args...)
	case customerrors.InternalErr:
		l.Error(e.Msg, args...)
	default:
		l.Error(e.Msg, args...)
	}
}
