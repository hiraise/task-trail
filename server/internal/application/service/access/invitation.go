package access

import (
	"context"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"task-trail/internal/domain/service/password"
)

// findInvitation finds an active invitation by the link token. If an account with the invitation
// email already exists: INVITATION_ACCEPTED, the link leads to sign-in even if expired (ADR-0016).
func findInvitation(
	ctx context.Context,
	invitations repository.InvitationRepository,
	users repository.UserRepository,
	token string,
	now time.Time,
) (*repository.InvitationDetails, error) {
	details, err := invitations.GetByTokenHash(ctx, entity.HashLinkToken(token))
	if isEntityNotFound(err) {
		return nil, domain.ErrLinkInvalid("reason", "no such invitation")
	}
	if err != nil {
		return nil, err
	}
	invitation := details.Invitation
	_, err = users.GetByEmail(ctx, invitation.Email)
	if err == nil {
		return nil, domain.ErrInvitationAccepted("invitationID", invitation.ID)
	}
	if !isEntityNotFound(err) {
		return nil, err
	}
	if invitation.IsExpired(now) {
		return nil, domain.ErrLinkInvalid("invitationID", invitation.ID, "reason", "invitation expired")
	}
	return details, nil
}

// InvitationLookupService shows where an invitation link leads before it is accepted.
type InvitationLookupService struct {
	clock                service.Clock
	invitationRepository repository.InvitationRepository
	userRepository       repository.UserRepository
}

func (s *InvitationLookupService) Execute(ctx context.Context, token string) (dto.InvitationInfo, error) {
	details, err := findInvitation(ctx, s.invitationRepository, s.userRepository, token, s.clock.Now())
	if err != nil {
		return dto.InvitationInfo{}, err
	}
	return dto.InvitationInfo{
		Email:       details.Invitation.Email,
		ProjectName: details.ProjectName,
		InvitedBy:   entity.DisplayName(details.InviterUsername, details.InviterEmail),
	}, nil
}

// AcceptInvitationService creates an account via an invitation link and opens a session right away.
// All active invitations of this email become memberships with the "member" role (ADR-0016).
type AcceptInvitationService struct {
	txManager            transaction.TxManager
	clock                service.Clock
	invitationRepository repository.InvitationRepository
	memberRepository     repository.ProjectMemberRepository
	userRepository       repository.UserRepository
	userFactory          *factory.UserFactory
	pwdHasher            password.PasswordHasher
	sessions             *sessionOpener
}

func (s *AcceptInvitationService) Execute(ctx context.Context, data dto.AcceptInvitation) (dto.Session, error) {
	now := s.clock.Now()
	// The link is checked before hashing the password: bcrypt is slow, so it is not wasted on invalid links
	details, err := findInvitation(ctx, s.invitationRepository, s.userRepository, data.Token, now)
	if err != nil {
		return dto.Session{}, err
	}
	hash, err := s.pwdHasher.HashPassword(data.Password)
	if err != nil {
		return dto.Session{}, err
	}
	email := details.Invitation.Email
	var session dto.Session
	f := func(ctx context.Context) error {
		user := s.userFactory.New(email, hash, data.Username)
		if err := s.userRepository.Create(ctx, user); err != nil {
			if isEntityAlreadyExists(err) {
				// A parallel acceptance of another link for the same email got there first
				return domain.ErrInvitationAccepted("invitationID", details.Invitation.ID, "reason", "concurrent accept")
			}
			return err
		}
		invitations, err := s.invitationRepository.ListByEmail(ctx, email)
		if err != nil {
			return err
		}
		for _, invitation := range invitations {
			if invitation.IsExpired(now) {
				continue
			}
			if err := s.memberRepository.Add(ctx, invitation.Membership(user.ID, now)); err != nil {
				return err
			}
		}
		tokens, err := s.sessions.open(ctx, user.ID)
		if err != nil {
			return err
		}
		session = dto.Session{User: user, Tokens: tokens}
		return nil
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return dto.Session{}, err
	}
	return session, nil
}
