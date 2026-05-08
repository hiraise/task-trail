package id

import (
	"github.com/google/uuid"
)

type UUIDGenerator struct{}

func New() *UUIDGenerator {
	return &UUIDGenerator{}
}
func (UUIDGenerator) Generate() string {
	return uuid.NewString()
}
