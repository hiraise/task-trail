package access

import (
	"context"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// CleanupService удаляет истёкшие refresh-токены. Отозванные и обменянные, но не истёкшие
// токены остаются: по ним видно повторное использование.
type CleanupService struct {
	clock                  service.Clock
	refreshTokenRepository repository.RefreshTokenRepository
}

// Execute возвращает, сколько токенов удалено.
func (s *CleanupService) Execute(ctx context.Context) (int64, error) {
	return s.refreshTokenRepository.DeleteExpired(ctx, s.clock.Now())
}
