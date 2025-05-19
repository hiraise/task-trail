package guuid

import (
	"task-trail/internal/pkg/uuid"

	guuid "github.com/google/uuid"
)

type UUIDGenerator struct{}

func New() uuid.Generator {
	return &UUIDGenerator{}
}
func (UUIDGenerator) Generate() string {
	return guuid.NewString()
}
