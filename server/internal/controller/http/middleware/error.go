package middleware

import (
	customerrors "task-trail/error"

	"github.com/gin-gonic/gin"
)

func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		for _, err := range c.Errors {
			switch e := err.Err.(type) {
			case *customerrors.ErrBase:
				c.AbortWithStatusJSON(e.Status, e)
			default:
				// TODO: add iternal error
				c.AbortWithStatusJSON(500, "jopa")
			}
		}

		// Cleanup error, beacause they already logged
		c.Errors = nil
	}
}
