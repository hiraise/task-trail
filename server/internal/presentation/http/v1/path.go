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
	if !isUUID(value) {
		return "", domain.ErrEntityNotFound(0, nil, name, value, "reason", "not a UUID")
	}
	return value, nil
}

// queryID — необязательный ID из параметра запроса: нет параметра — nil, не UUID — 404,
// как и в пути (контракт).
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
