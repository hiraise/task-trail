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
	"time"
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

func (u *AuthUC) Register(ctx context.Context, email string, password string) error {

	if isTaken, err := u.userRepo.EmailIsTaken(ctx, email); err != nil {
		u.logger.Error("unique email verification failed", "error", err, "email", email)
		return customerrors.NewErrInternal(nil)
	} else {
		if isTaken {
			u.logger.Warn("email is taken", "email", email)
			return customerrors.NewErrConflict(map[string]any{"email": email})
		}
	}

	f := func(ctx context.Context) error {
		hash, err := u.passwordSvc.HashPassword(password)
		if err != nil {
			u.logger.Warn("password hashing failed", "error", err)
			return customerrors.NewErrInternal(nil)
		}

		user := &entity.User{Email: email, PasswordHash: string(hash)}
		if err := u.userRepo.Create(ctx, user); err != nil {
			u.logger.Error("failed to create new user", "error", err)
			return customerrors.NewErrInternal(nil)
		}
		return nil
	}

	return u.txManager.DoWithTx(ctx, f)
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

	return u.generateTokens(ctx, user.ID)
}

func (u *AuthUC) Refresh(ctx context.Context, oldRT string) (*token.Token, *token.Token, error) {
	userId, tokenId, err := u.tokenSvc.VerifyRefreshToken(oldRT)
	if err != nil {
		return u.unatuhorized(err, "invalid refresh token")
	}
	oldDbToken, err := u.tokenRepo.GetTokenById(ctx, tokenId, userId)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return u.unatuhorized(err, "refresh token not found", "tokenId", tokenId, "userId", userId)
		}
		return u.internalTrouble(err, "database error", "tokenId", tokenId, "userId", userId)
	}
	if oldDbToken.ExpiredAt.Unix() < time.Now().Unix() {
		return u.unatuhorized(nil, "refresh token is to old", "tokenId", tokenId, "userId", userId)
	}
	if oldDbToken.RevokedAt != nil {
		revoked_tokens, err := u.tokenRepo.RevokeAllUsersTokens(ctx, userId)
		if err != nil {
			return u.internalTrouble(err, "database error", "tokenId", tokenId, "userId", userId)
		}
		return u.unatuhorized(
			nil,
			"refresh token is revoked, all user tokens was revoked",
			"tokenId", tokenId,
			"userId", userId,
			"revoked_tokens", revoked_tokens)

	}
	var at, rt *token.Token
	u.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		at, rt, err = u.generateTokens(ctx, userId)
		if err != nil {
			return err
		}
		if err := u.tokenRepo.RevokeToken(ctx, tokenId); err != nil {
			return err
		}
		return nil
	})

	return at, rt, nil
}

func (u *AuthUC) generateTokens(ctx context.Context, userId int) (*token.Token, *token.Token, error) {
	at, err := u.tokenSvc.GenAccessToken(userId)
	if err != nil {
		return u.internalTrouble(err, "generation access token error", "userId", userId)
	}
	rt, err := u.tokenSvc.GenRefreshToken(userId)
	if err != nil {
		return u.internalTrouble(err, "generation refresh token error", "userId", userId)

	}

	token := entity.Token{
		ID:        rt.Jti,
		ExpiredAt: rt.Exp,
		UserId:    userId,
	}
	if err := u.tokenRepo.Create(ctx, token); err != nil {
		return u.internalTrouble(err, "database error", "userId", userId)
	}
	return at, rt, nil
}
func (u *AuthUC) invalidCredentials(err error, msg string, args ...any) (*token.Token, *token.Token, error) {
	if err != nil {
		args = append(args, "error", err.Error())
	}
	u.logger.Warn(msg, args...)
	return &token.Token{}, &token.Token{}, customerrors.NewErrInvalidCredentials(nil)
}

func (u *AuthUC) unatuhorized(err error, msg string, args ...any) (*token.Token, *token.Token, error) {
	if err != nil {
		args = append(args, "error", err.Error())
	}
	u.logger.Warn(msg, args...)
	return &token.Token{}, &token.Token{}, customerrors.NewErrUnauthorized(nil)
}

func (u *AuthUC) internalTrouble(err error, msg string, args ...any) (*token.Token, *token.Token, error) {
	if err != nil {
		args = append(args, "error", err.Error())
	}
	u.logger.Error(msg, args...)
	return &token.Token{}, &token.Token{}, customerrors.NewErrInternal(nil)
}
