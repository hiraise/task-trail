package access

import (
	"context"
	"time"

	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// CleanupService deletes expired refresh tokens, password reset links and invitations.
// Revoked and exchanged but unexpired refresh tokens stay: they reveal reuse.
// Accepted invitations also stay until they expire: their links lead to sign-in.
type CleanupService struct {
	clock                  service.Clock
	refreshTokenRepository repository.RefreshTokenRepository
	passwordResetRepo      repository.PasswordResetRepository
	invitationRepository   repository.InvitationRepository
}

// Execute returns how many records were deleted.
func (s *CleanupService) Execute(ctx context.Context) (int64, error) {
	now := s.clock.Now()
	var total int64
	for _, deleteExpired := range []func(context.Context, time.Time) (int64, error){
		s.refreshTokenRepository.DeleteExpired,
		s.passwordResetRepo.DeleteExpired,
		s.invitationRepository.DeleteExpired,
	} {
		deleted, err := deleteExpired(ctx, now)
		if err != nil {
			return total, err
		}
		total += deleted
	}
	return total, nil
}
