package password

import (
	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	ComparePassword(password string, hash string) error
	HashPassword(password string) (string, error)
}

type BcryptService struct{}

func NewBcryptService() *BcryptService {
	return &BcryptService{}
}

func (BcryptService) ComparePassword(password string, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func (BcryptService) HashPassword(password string) (string, error) {
	val, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(val), err
}
