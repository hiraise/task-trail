package bcrypt

import (
	"task-trail/internal/pkg/password"

	"golang.org/x/crypto/bcrypt"
)

// hashing cost
const cost = 12

type bcryptService struct{}

func New() password.Service {
	return &bcryptService{}
}

func (s *bcryptService) ComparePassword(password string, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func (s *bcryptService) HashPassword(password string) (string, error) {
	val, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	return string(val), err
}
