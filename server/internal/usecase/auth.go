package usecase

import (
	"context"
	"errors"

	"task-trail/customerrors"
	"task-trail/internal/entity"
	"task-trail/internal/pkg/password"
	"task-trail/internal/pkg/token"
	"task-trail/internal/repo"
	"time"
)

type AuthUC struct {
	errHandler  customerrors.ErrorHandler
	txManager   repo.TxManager
	userRepo    repo.UserRepository
	tokenRepo   repo.TokenRepository
	passwordSvc password.Service
	tokenSvc    token.Service
}

func NewAuthUC(
	errHandler customerrors.ErrorHandler,
	txManager repo.TxManager,
	userRepo repo.UserRepository,
	tokenRepo repo.TokenRepository,
	passwordSvc password.Service,
	tokenSvc token.Service,
) *AuthUC {
	return &AuthUC{
		errHandler:  errHandler,
		txManager:   txManager,
		userRepo:    userRepo,
		tokenRepo:   tokenRepo,
		passwordSvc: passwordSvc,
		tokenSvc:    tokenSvc,
	}
}

func (u *AuthUC) Register(ctx context.Context, email string, password string) error {

	if isTaken, err := u.userRepo.EmailIsTaken(ctx, email); err != nil {
		return u.errHandler.InternalTrouble(err, "unique email verification failed", "email", email)
	} else {
		if isTaken {
			return u.errHandler.Conflict(err, "email already taken", "email", email)
		}
	}

	f := func(ctx context.Context) error {
		hash, err := u.passwordSvc.HashPassword(password)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "password hashing failed")
		}

		user := &entity.User{Email: email, PasswordHash: string(hash)}
		if err := u.userRepo.Create(ctx, user); err != nil {
			return u.errHandler.InternalTrouble(err, "failed to create new user", "email", email)
		}
		return nil
	}

	return u.txManager.DoWithTx(ctx, f)
}

func (u *AuthUC) Login(ctx context.Context, email string, password string) (int, *token.Token, *token.Token, error) {
	user, err := u.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return 0, nil, nil, u.errHandler.InvalidCredentials(err, "user not found", "email", email)
		}
		return 0, nil, nil, u.errHandler.InternalTrouble(err, "user loading failed", "email", email)

	}
	if user.VerifiedAt == nil {
		return 0, nil, nil, u.errHandler.InvalidCredentials(nil, "user is unverified", "email", email)
	}
	if err := u.passwordSvc.ComparePassword(password, user.PasswordHash); err != nil {
		return 0, nil, nil, u.errHandler.InvalidCredentials(err, "user enter wrong password", "email", email)
	}

	at, rt, err := u.generateTokens(user.ID)
	if err != nil {
		return 0, nil, nil, err
	}

	t := entity.Token{
		ID:        rt.Jti,
		ExpiredAt: rt.Exp,
		UserId:    user.ID,
	}
	if err := u.tokenRepo.Create(ctx, t); err != nil {
		if errors.Is(err, repo.ErrConflict) {
			return 0, nil, nil, u.errHandler.Conflict(err, "refresh token already exists", "tokenId", t.ID, "userId", user.ID)
		}
		return 0, nil, nil, u.errHandler.InternalTrouble(err, "failed to create new refresh token", "tokenId", t.ID, "userId", user.ID)
	}
	return user.ID, at, rt, nil
}

func (u *AuthUC) Refresh(ctx context.Context, oldRT string) (*token.Token, *token.Token, error) {
	userId, tokenId, err := u.verifyRefreshToken(ctx, oldRT)
	if err != nil {
		return nil, nil, err
	}
	var at, rt *token.Token
	f := func(ctx context.Context) error {
		at, rt, err = u.generateTokens(userId)
		if err != nil {
			return err
		}
		return u.revokeToken(ctx, tokenId, userId)
	}

	if err := u.txManager.DoWithTx(ctx, f); err != nil {
		return nil, nil, err
	}

	return at, rt, nil
}

func (u *AuthUC) Logout(ctx context.Context, rt string) error {
	userId, tokenId, err := u.verifyRefreshToken(ctx, rt)
	if err != nil {
		return err
	}
	return u.revokeToken(ctx, tokenId, userId)
}

func (u *AuthUC) verifyRefreshToken(ctx context.Context, rt string) (int, string, error) {
	userId, tokenId, err := u.tokenSvc.VerifyRefreshToken(rt)
	if err != nil {
		return 0, "", u.errHandler.Unauthorized(err, "invalid refresh token")
	}
	dbToken, err := u.tokenRepo.GetTokenById(ctx, tokenId, userId)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return 0, "", u.errHandler.Unauthorized(err, "refresh token not found", "tokenId", tokenId, "userId", userId)
		}
		return 0, "", u.errHandler.InternalTrouble(err, "refresh token loading failed", "tokenId", tokenId, "userId", userId)
	}
	if dbToken.ExpiredAt.Unix() < time.Now().Unix() {
		return 0, "", u.errHandler.Unauthorized(nil, "refresh token is to old", "tokenId", tokenId, "userId", userId)
	}
	if dbToken.RevokedAt != nil {
		revoked_tokens, err := u.tokenRepo.RevokeAllUsersTokens(ctx, userId)
		if err != nil {
			return 0, "", u.errHandler.InternalTrouble(err, "revoke all users refresh tokens failed", "tokenId", tokenId, "userId", userId)
		}
		return 0, "", u.errHandler.Unauthorized(
			nil,
			"refresh token is revoked, all user tokens was revoked",
			"tokenId", tokenId,
			"userId", userId,
			"revoked_tokens", revoked_tokens,
		)
	}
	return userId, tokenId, nil
}

func (u *AuthUC) revokeToken(ctx context.Context, tokenId string, userId int) error {
	if err := u.tokenRepo.RevokeToken(ctx, tokenId); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return u.errHandler.Unauthorized(err, "refresh token not found", "tokenId", tokenId, "userId", userId)
		}
		return u.errHandler.InternalTrouble(err, "revoke refresh token failed", "tokenId", tokenId, "userId", userId)
	}
	return nil
}

func (u *AuthUC) generateTokens(userId int) (*token.Token, *token.Token, error) {
	at, err := u.tokenSvc.GenAccessToken(userId)
	if err != nil {
		return nil, nil, u.errHandler.InternalTrouble(err, "generation access token failed", "userId", userId)
	}
	rt, err := u.tokenSvc.GenRefreshToken(userId)
	if err != nil {
		return nil, nil, u.errHandler.InternalTrouble(err, "generation refresh token failed", "userId", userId)
	}
	return at, rt, nil
}
