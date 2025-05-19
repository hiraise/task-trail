package response

import (
	"fmt"
	"net/http"
	"strings"
	"task-trail/internal/customerrors"

	"github.com/go-playground/validator/v10"
)

type ErrAPI struct {
	Status   int            `json:"-"`
	Msg      string         `json:"msg,omitempty"`
	Metadata map[string]any `json:"metadata,omitempty"`
}

func New(status int, msg string, metadata map[string]any) *ErrAPI {
	return &ErrAPI{Status: status, Msg: msg, Metadata: metadata}
}

func NewFromErrBase(err *customerrors.Err) *ErrAPI {
	switch err.Type {
	case customerrors.UnauthorizedErr:
		return New(http.StatusUnauthorized, "authentication required", err.ResponseData)
	case customerrors.InvalidCredentialsErr:
		return New(http.StatusUnauthorized, "invalid credentials", err.ResponseData)
	case customerrors.ValidationErr:
		return New(http.StatusBadRequest, err.Msg, prepareValidationErrMetadata(err))
	case customerrors.ConflictErr:
		return New(http.StatusConflict, "entity already exists", err.ResponseData)
	default:
		return New(http.StatusInternalServerError, "internal error", err.ResponseData)
	}
}

func prepareValidationErrMetadata(err *customerrors.Err) map[string]any {
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
		return nil
	}
	return metadata
}

func msgForTag(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "field required"
	case "email":
		return "format is incorrect"
	case "min":
		return fmt.Sprintf("min length: %s symbols", fe.Param())
	case "max":
		return fmt.Sprintf("max length: %s symbols", fe.Param())
	default:
		return "invalid value"
	}
}
