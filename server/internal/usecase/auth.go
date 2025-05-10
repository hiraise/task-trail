package usecase

import (
	"context"
	"errors"
	customerrors "task-trail/error"
	"task-trail/internal/entity"
	"task-trail/internal/pkg/password"
	"task-trail/internal/pkg/token"
	"task-trail/internal/repo"
	"task-trail/pkg/logger"
)

type AuthUC struct {
	logger      logger.Logger
	txManager   repo.TxManager
	userRepo    repo.UserRepository
	tokenRepo   repo.TokenRepository
	passwordSvc password.Service
	tokenSvc    token.Service
}

// NewAuthUC creates a new instance of AuthUseCase.
func NewAuthUC(
	logger logger.Logger,
	txManager repo.TxManager,
	userRepo repo.UserRepository,
	tokenRepo repo.TokenRepository,
	passwordSvc password.Service,
	tokenSvc token.Service,
) *AuthUC {
	return &AuthUC{
		logger:      logger,
		txManager:   txManager,
		userRepo:    userRepo,
		tokenRepo:   tokenRepo,
		passwordSvc: passwordSvc,
		tokenSvc:    tokenSvc,
	}
}

func (u *AuthUC) Login(ctx context.Context, email string, password string) (*token.Token, *token.Token, error) {
	user, err := u.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return u.invalidCredentials(err, "user not found", "email", email)
		}
		return u.internalTrouble(err, "database error", "email", email)

	}
	if user.VerifiedAt == nil {
		return u.invalidCredentials(nil, "user is unverified", "email", email)
	}
	if err := u.passwordSvc.ComparePassword(password, user.PasswordHash); err != nil {
		return u.invalidCredentials(nil, "user enter wrong password", "email", email)
	}

	// gen tokens
	at, err := u.tokenSvc.GenAccessToken(user.ID)
	if err != nil {
		return u.internalTrouble(err, "generation access token error", "userId", user.ID)
	}
	rt, err := u.tokenSvc.GenRefreshToken(user.ID)
	if err != nil {
		return u.internalTrouble(err, "generation refresh token error", "userId", user.ID)

	}

	token := entity.Token{
		ID:        rt.Jti,
		ExpiredAt: rt.Exp,
		UserId:    user.ID,
	}
	if err := u.tokenRepo.Create(ctx, token); err != nil {
		return u.internalTrouble(err, "database error", "userId", user.ID)
	}
	return at, rt, nil
}

func (u *AuthUC) invalidCredentials(err error, msg string, args ...any) (*token.Token, *token.Token, error) {
	if err != nil {
		args = append(args, "err", err.Error())
	}
	u.logger.Warn(msg, args...)
	return &token.Token{}, &token.Token{}, customerrors.NewErrInvalidCredentials(nil)
}

func (u *AuthUC) internalTrouble(err error, msg string, args ...any) (*token.Token, *token.Token, error) {
	if err != nil {
		args = append(args, "err", err.Error())
	}
	u.logger.Error(msg, args...)
	return &token.Token{}, &token.Token{}, customerrors.NewErrInternal(nil)
}
