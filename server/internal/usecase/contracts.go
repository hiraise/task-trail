package usecase

import (
	"context"
	"task-trail/internal/pkg/token"
)

type Authentication interface {
	Login(ctx context.Context, email string, password string) (*token.Token, *token.Token, error)
	Register(ctx context.Context, email string, password string) error
	// Logout(ctx context.Context) error
	// Refresh(ctx context.Context) error
}

type User interface {
	// CreateNew(ctx context.Context, email string, password string) error
}
