package entity

import (
	"task-trail/internal/domain"
	"time"
)

type ConfirmationTokenID string

type ConfirmationTokenPurpose string

const AccountVerification ConfirmationTokenPurpose = "ACCOUNT_VERIFICATION"
const ResetPasswordConfirmation ConfirmationTokenPurpose = "RESET_PASSWORD_CONFIRMATION"

type ConfirmationToken struct {
	ID        ConfirmationTokenID
	UserID    UserID
	Purpose   ConfirmationTokenPurpose
	ExpiredAt time.Time
	UsedAt    *time.Time
}

func (t *ConfirmationToken) Validate() error {
	if t.ExpiredAt.Unix() <= time.Now().Unix() {
		return domain.ErrConfirmationTokenExpired("tokenID", t.ID, "userID", t.UserID)
	}
	if t.UsedAt != nil {
		return domain.ErrConfirmationTokenAlreadyUsed("tokenID", t.ID, "userID", t.UserID)
	}
	return nil
}

func (t *ConfirmationToken) Use() {
	now := time.Now()
	t.UsedAt = &now
}
