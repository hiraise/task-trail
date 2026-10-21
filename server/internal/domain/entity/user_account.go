package entity

import (
	"task-trail/internal/domain"
	"task-trail/internal/domain/service/password"
	"time"
)

type UserID string

type Email string

type UserAccount struct {
	ID           UserID
	Email        Email
	PasswordHash *string
	VerifiedAt   *time.Time
}

func NewUser(id UserID, email Email, passwordHash *string, verifiedAt *time.Time) *UserAccount {
	return &UserAccount{ID: id, Email: email, PasswordHash: passwordHash, VerifiedAt: verifiedAt}
}

func (u *UserAccount) HasPassword() error {
	if u.PasswordHash == nil {
		return domain.ErrPasswordNotSet("userID", u.ID)
	}
	return nil
}

func (u *UserAccount) CheckVerification() error {
	if u.VerifiedAt == nil {
		return domain.ErrUserUnverified("userID", u.ID)
	}
	return nil
}

func (u *UserAccount) Verify() error {
	if u.VerifiedAt != nil {
		return domain.ErrUserAlreadyVerified("userID", u.ID)
	}
	now := time.Now()
	u.VerifiedAt = &now
	return nil
}

func (u *UserAccount) VerifyOldPassword(pwd string, pwdService password.PasswordService) error {
	equal, err := pwdService.ComparePassword(pwd, *u.PasswordHash)
	if err != nil {
		return err
	}
	if !equal {
		return domain.ErrWrongPassword("userID", u.ID)
	}
	return nil
}

func (u *UserAccount) ChangePassword(newPassword string, pwdService password.PasswordService) error {
	equal, err := pwdService.ComparePassword(newPassword, *u.PasswordHash)
	if err != nil {
		return err
	}
	if equal {
		return domain.ErrPasswordSameAsOld("userID", u.ID)
	}
	newHash, err := pwdService.HashPassword(newPassword)
	if err != nil {
		return err
	}
	u.PasswordHash = &newHash
	return nil
}
