package customerrors

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

type Http struct {
	Description string `json:"description,omitempty"`
	Metadata    any    `json:"metadata,omitempty"`
	StatusCode  int    `json:"-"`
}

func (e Http) Error() string {
	return fmt.Sprintf("description: %s,  metadata: %s", e.Description, e.Metadata)
}

func NewHttpError(description, metadata string, statusCode int) Http {
	return Http{
		Description: description,
		Metadata:    metadata,
		StatusCode:  statusCode,
	}
}

func NewValidationError(err error) Http {

	switch e := err.(type) {
	case validator.ValidationErrors:
		metadata := make(map[string]string)
		for _, v := range e {
			metadata[strings.ToLower(v.Field())] = msgForTag(v)
		}
		return Http{
			Description: "validation error",
			Metadata:    metadata,
			StatusCode:  http.StatusBadRequest,
		}
	default:
		return Http{
			Description: "validation error",
			Metadata:    nil,
			StatusCode:  http.StatusBadRequest,
		}
	}

}

func NewConflictError(msg string) Http {
	return Http{
		Description: "conflict",
		Metadata:    msg,
		StatusCode:  http.StatusConflict,
	}
}

func NewEmailTakenError() Http {
	return Http{
		Description: "email already taken",
		StatusCode:  http.StatusConflict,
	}
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
