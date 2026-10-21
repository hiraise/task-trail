package password

import (
	"errors"
	"task-trail/internal/domain"

	"golang.org/x/crypto/bcrypt"
)

type BcryptPasswordService struct {
	cost int
}

func New(hashingCost int) *BcryptPasswordService {

	return &BcryptPasswordService{cost: hashingCost}
}

func (s *BcryptPasswordService) ComparePassword(password string, hash string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return false, nil
		}
		return false, domain.ErrPasswordCompareFailed(err)
	}
	return true, nil
}

func (s *BcryptPasswordService) HashPassword(password string) (string, error) {
	val, err := bcrypt.GenerateFromPassword([]byte(password), s.cost)
	if err != nil {
		return "", domain.ErrPasswordHashingFailed(err)
	}
	return string(val), nil
}
