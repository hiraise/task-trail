package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"time"
)

type InvitationFactory struct {
	idGenerator service.IDGenerator
	tokens      service.LinkTokenGenerator
	clock       service.Clock
	lifetime    time.Duration
}

func NewInvitationFactory(idGenerator service.IDGenerator, tokens service.LinkTokenGenerator, clock service.Clock, lifetime time.Duration) *InvitationFactory {
	return &InvitationFactory{idGenerator: idGenerator, tokens: tokens, clock: clock, lifetime: lifetime}
}

// New creates an invitation: token goes into the link, the entity keeps only its hash.
func (f *InvitationFactory) New(projectID entity.ProjectID, email entity.Email, invitedBy entity.UserID) (token string, invitation *entity.Invitation) {
	token = f.tokens.Generate()
	now := f.clock.Now()
	return token, &entity.Invitation{
		ID:        entity.InvitationID(f.idGenerator.Generate()),
		ProjectID: projectID,
		Email:     email,
		InvitedBy: invitedBy,
		TokenHash: entity.HashLinkToken(token),
		ExpiredAt: now.Add(f.lifetime),
		CreatedAt: now,
	}
}
