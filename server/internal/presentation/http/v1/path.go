package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"task-trail/internal/domain"
)

// pathID — ID ресурса из пути. Не UUID — 404 NOT_FOUND, как для несуществующего ресурса
// (контракт): иначе PostgreSQL откажет в разборе UUID, и ответ был бы 500.
func pathID(c *gin.Context, name string) (string, error) {
	value := c.Param(name)
	if len(value) != 36 || uuid.Validate(value) != nil {
		return "", domain.ErrEntityNotFound(0, nil, name, value, "reason", "not a UUID")
	}
	return value, nil
}
