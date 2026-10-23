package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"task-trail/internal/domain"
	"task-trail/internal/presentation/http/v1/request"
)

// pathID is the resource ID from the path. Not a UUID — 404 NOT_FOUND, as for a missing resource
// (contract): otherwise PostgreSQL would fail to parse the UUID and the response would be 500.
func pathID(c *gin.Context, name string) (string, error) {
	value := c.Param(name)
	if !isUUID(value) {
		return "", domain.ErrEntityNotFound(0, nil, name, value, "reason", "not a UUID")
	}
	return value, nil
}

// queryID is an optional ID from a query parameter: no parameter — nil, not a UUID — 404,
// as in the path (contract).
func queryID(c *gin.Context, name string) (*string, error) {
	value, ok := c.GetQuery(name)
	if !ok {
		return nil, nil
	}
	if !isUUID(value) {
		return nil, domain.ErrEntityNotFound(0, nil, name, value, "reason", "not a UUID")
	}
	return &value, nil
}

// queryBool is a boolean query parameter: no parameter — false, true or false — the value,
// anything else — VALIDATION_FAILED with details.<name>.
func queryBool(c *gin.Context, name string) (bool, error) {
	value, ok := c.GetQuery(name)
	switch {
	case !ok || value == "false":
		return false, nil
	case value == "true":
		return true, nil
	}
	return false, domain.ErrInputValidation(0, request.FieldErrors{name: "нужно true или false"})
}

func isUUID(value string) bool {
	return len(value) == 36 && uuid.Validate(value) == nil
}
