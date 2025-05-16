package middleware

import (
	"task-trail/customerrors"
	"task-trail/internal/controller/http/v1/response"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/pkg/logger"

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
				// TODO: add iternal error
				c.AbortWithStatusJSON(500, "jopa")
			}
		}

		// Cleanup error, beacause they already logged
		c.Errors = nil
	}
}

func logError(e *customerrors.Err, l logger.Logger, reqId any) {
	args := append(e.Data, "source", e.Source, "requestId", reqId, "error", e.Unwrap())
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
