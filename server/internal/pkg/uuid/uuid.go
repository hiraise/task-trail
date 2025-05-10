package uuid

import "github.com/google/uuid"

type Generator interface {
	Generate() string
}

type UUIDGenerator struct{}

func (UUIDGenerator) Generate() string {
	return uuid.NewString()
}
