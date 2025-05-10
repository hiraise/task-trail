package validationerr

import (
	"fmt"
	"net/http"
	"strings"
	customerrors "task-trail/error"

	"github.com/go-playground/validator/v10"
)

func New(err error) *customerrors.ErrBase {
	metadata := make(map[string]any)
	switch e := err.(type) {
	case validator.ValidationErrors:
		for _, v := range e {
			metadata[strings.ToLower(v.Field())] = msgForTag(v)
		}
	default:
		metadata["err"] = err.Error()
	}
	return &customerrors.ErrBase{
		Status:   http.StatusBadRequest,
		Msg:      "validation error",
		Metadata: metadata,
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
