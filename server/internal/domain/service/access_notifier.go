package service

import "task-trail/internal/domain/entity"

type AccessNotifier interface {
	SendAccountConfirmation(email entity.Email, tokenID entity.ConfirmationTokenID) error
	SendPasswordResetConfirmation(email entity.Email, tokenID entity.ConfirmationTokenID) error
}
