package usecase

import (
	"context"
	"task-trail/internal/pkg/token"
)

type Authentication interface {
	Login(ctx context.Context, email string, password string) (int, *token.Token, *token.Token, error)
	Register(ctx context.Context, email string, password string) error
	Logout(ctx context.Context, rt string) error
	Refresh(ctx context.Context, rt string) (*token.Token, *token.Token, error)
	Verify(ctx context.Context, tokenID string) error
	ResendVerificationEmail(ctx context.Context, email string) error
	SendPasswordResetEmail(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, email string, password string) error
}

type User interface {
	// CreateNew(ctx context.Context, email string, password string) error
}
