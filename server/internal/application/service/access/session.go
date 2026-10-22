package access

import (
	"context"
	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// sessionOpener issues a new token pair: the refresh token is stored in the database so that
// it can be exchanged once and revoked.
type sessionOpener struct {
	factory      *factory.RefreshTokenFactory
	repository   repository.RefreshTokenRepository
	tokenService service.AccessTokenService
}

func (s *sessionOpener) open(ctx context.Context, userID entity.UserID) (dto.Tokens, error) {
	refreshToken := s.factory.NewToken(userID)
	if err := s.repository.Create(ctx, refreshToken); err != nil {
		return dto.Tokens{}, err
	}
	at, rt, err := s.tokenService.GenerateTokensPair(userID, refreshToken)
	if err != nil {
		return dto.Tokens{}, err
	}
	return dto.Tokens{UserID: userID, AccessToken: at, RefreshToken: rt}, nil
}
