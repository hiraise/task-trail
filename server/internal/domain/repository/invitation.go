package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// InvitationDetails — приглашение и то, что человек видит по его ссылке.
type InvitationDetails struct {
	Invitation      *entity.Invitation
	ProjectName     string
	InviterUsername *string
	InviterEmail    entity.Email
}

type InvitationRepository interface {
	// Create сохраняет приглашение. Приглашение той же почты в тот же проект заменяет
	// прежнее, и старая ссылка перестаёт действовать (ADR-0016).
	Create(ctx context.Context, invitation *entity.Invitation) error
	// GetByTokenHash находит приглашение по хешу токена ссылки. Приглашения удалённого
	// проекта не действуют (ADR-0001) и не находятся.
	GetByTokenHash(ctx context.Context, hash entity.LinkTokenHash) (*InvitationDetails, error)
	// ListByEmail — приглашения почты в неудалённые проекты, вместе с истёкшими.
	ListByEmail(ctx context.Context, email entity.Email) ([]*entity.Invitation, error)
	// DeleteExpired удаляет приглашения, истёкшие к моменту now, и возвращает, сколько удалено.
	DeleteExpired(ctx context.Context, now time.Time) (int64, error)
}
