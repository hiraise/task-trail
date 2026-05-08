package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"task-trail/internal/domain"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/logger"
	"task-trail/internal/presentation/http/v1/response"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// log err and return prepared response
func NewError(l logger.Logger, m *contextmanager.GinContextManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		for _, err := range c.Errors {
			switch e := err.Err.(type) {
			case *domain.DomainError:
				apiErr := proccessDomainError(e, l, m.GetRequestID(c))
				c.AbortWithStatusJSON(apiErr.Status, apiErr)
			default:
				l.Error("unexpected error", "error", err)
				c.AbortWithStatusJSON(500, "unexpected error")
			}
		}

		// Cleanup error, beacause they already logged
		c.Errors = nil
	}
}

func proccessDomainError(e *domain.DomainError, l logger.Logger, reqID string) *response.ErrAPI {
	args := []any{"requestID", reqID, "source", e.Source}
	if e.Metadata != nil {
		args = append(args, "metadata", e.Metadata)
	}
	switch e.Code {
	case domain.PasswordNotSet, domain.UserUnverified, domain.WrongPassword, domain.WrongEmail:

		l.Warn(string(e.Code), args...)
		return response.NewApiErr(http.StatusUnauthorized, "invalid credentials")
	case
		domain.UserAlreadyVerified,
		domain.ConfirmationTokenWrong,
		domain.ConfirmationTokenAlreadyUsed,
		domain.ConfirmationTokenExpired,
		domain.RefreshTokenAlreadyUsed,
		domain.RefreshTokenNotFound,
		domain.RefreshTokenWrong,
		domain.RefreshTokenExpired,
		domain.AccessTokenExpired,
		domain.AccessTokenNotFound,
		domain.AccessTokenWrong:

		l.Warn(string(e.Code), args...)
		return response.NewApiErr(http.StatusUnauthorized, "invalid token")
	case domain.EmailAlreadyExists:

		l.Warn(string(e.Code), args...)
		return response.NewApiErr(http.StatusConflict, "conflict")

	case domain.InputValidation:

		meta := prepareValidationErrMetadata(e)
		args = append(args, "metadata", meta)
		l.Warn(string(e.Code), args...)
		return response.NewApiErr(http.StatusUnprocessableEntity, "request validation failed").WithMeta(meta)

	default:
		// raw erros from repository also handled as internal error
		args = append(args, "error", e.Unwrap())
		l.Error(string(e.Code), args...)
		return response.NewApiErr(http.StatusInternalServerError, "internal error")
	}
}

func prepareValidationErrMetadata(err *domain.DomainError) map[string]any {
	metadata := make(map[string]any)
	sourceErr := err.Unwrap()
	if sourceErr == nil {
		return nil
	}
	switch e := sourceErr.(type) {
	case validator.ValidationErrors:
		for _, v := range e {
			metadata[strings.ToLower(v.Field())] = msgForTag(v)
		}
	default:
		metadata["error"] = e.Error()
	}
	return metadata
}

func msgForTag(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "field required"
	case "email", "uuid":
		return "format is incorrect"
	case "min":
		return fmt.Sprintf("min length: %s symbols", fe.Param())
	case "max":
		return fmt.Sprintf("max length: %s symbols", fe.Param())
	default:
		return "invalid value"
	}
}
