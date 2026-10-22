package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"task-trail/internal/domain"
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

func isUUID(value string) bool {
	return len(value) == 36 && uuid.Validate(value) == nil
}
