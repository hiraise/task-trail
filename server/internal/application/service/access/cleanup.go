package access

import (
	"context"
	"time"

	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// CleanupService удаляет истёкшие refresh-токены, ссылки сброса пароля и приглашения.
// Отозванные и обменянные, но не истёкшие refresh-токены остаются: по ним видно повторное
// использование. Принятые приглашения тоже остаются до конца срока: их ссылки ведут на вход.
type CleanupService struct {
	clock                  service.Clock
	refreshTokenRepository repository.RefreshTokenRepository
	passwordResetRepo      repository.PasswordResetRepository
	invitationRepository   repository.InvitationRepository
}

// Execute возвращает, сколько записей удалено.
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
