package auth

import (
	"context"
	"errors"

	"task-trail/internal/customerrors"
	"task-trail/internal/pkg/password"
	"task-trail/internal/pkg/token"
	"task-trail/internal/pkg/uuid"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"time"
)

type UseCase struct {
	errHandler       customerrors.ErrorHandler
	txManager        repo.TxManager
	userRepo         repo.UserRepository
	rtRepo           repo.RefreshTokenRepository
	etRepo           repo.EmailTokenRepository
	notificationRepo repo.NotificationRepository
	passwordSvc      password.Service
	tokenSvc         token.Service
	uuid             uuid.Generator
}

func New(
	errHandler customerrors.ErrorHandler,
	txManager repo.TxManager,
	userRepo repo.UserRepository,
	rtRepo repo.RefreshTokenRepository,
	etRepo repo.EmailTokenRepository,
	notificationRepo repo.NotificationRepository,
	passwordSvc password.Service,
	tokenSvc token.Service,
	uuid uuid.Generator,
) *UseCase {
	return &UseCase{
		errHandler:       errHandler,
		txManager:        txManager,
		userRepo:         userRepo,
		rtRepo:           rtRepo,
		etRepo:           etRepo,
		notificationRepo: notificationRepo,
		passwordSvc:      passwordSvc,
		tokenSvc:         tokenSvc,
		uuid:             uuid,
	}
}

func (u *UseCase) verifyRT(ctx context.Context, rt string) (int, string, error) {
	userID, tokenID, err := u.tokenSvc.VerifyRefreshToken(rt)
	if err != nil {
		return 0, "", u.errHandler.Unauthorized(err, "invalid refresh token")
	}
	dbToken, err := u.rtRepo.GetByID(ctx, tokenID, userID)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return 0, "", u.errHandler.Unauthorized(err, "refresh token not found", "tokenID", tokenID, "userID", userID)
		}
		return 0, "", u.errHandler.InternalTrouble(err, "failed to get refresh token", "tokenID", tokenID, "userID", userID)
	}
	if dbToken.ExpiredAt.Unix() <= time.Now().Unix() {
		return 0, "", u.errHandler.Unauthorized(nil, "refresh token is expired", "tokenID", tokenID, "userID", userID)
	}
	if dbToken.RevokedAt != nil {
		revoked_tokens, err := u.rtRepo.RevokeAllUsersTokens(ctx, userID)
		if err != nil {
			return 0, "", u.errHandler.InternalTrouble(err, "failed to revoke all users refresh tokens", "tokenID", tokenID, "userID", userID)
		}
		return 0, "", u.errHandler.Unauthorized(
			nil,
			"refresh token is revoked, all user tokens was revoked",
			"tokenID", tokenID,
			"userID", userID,
			"revoked_tokens", revoked_tokens,
		)
	}
	return userID, tokenID, nil
}

func (u *UseCase) revokeRT(ctx context.Context, tokenID string, userID int) error {
	if err := u.rtRepo.Revoke(ctx, tokenID); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return u.errHandler.Unauthorized(err, "refresh token not found", "tokenID", tokenID, "userID", userID)
		}
		return u.errHandler.InternalTrouble(err, "failed to revoke refresh token", "tokenID", tokenID, "userID", userID)
	}
	return nil
}

func (u *UseCase) generateAuthTokens(userID int) (*dto.AccessTokenRes, *dto.RefreshTokenRes, error) {
	at, err := u.tokenSvc.GenAccessToken(userID)
	if err != nil {
		return nil, nil, u.errHandler.InternalTrouble(err, "failed to generate access token", "userID", userID)
	}
	rt, err := u.tokenSvc.GenRefreshToken(userID)
	if err != nil {
		return nil, nil, u.errHandler.InternalTrouble(err, "failed to generate refresh token", "userID", userID)
	}
	return at, rt, nil
}

func (u *UseCase) createEmailToken(ctx context.Context, userID int, purpose dto.EmailTokenPurpose) (string, error) {
	et := &dto.EmailTokenCreate{
		ID:        u.uuid.Generate(),
		ExpiredAt: time.Now().Add(time.Minute * 10),
		UserID:    userID,
		Purpose:   purpose,
	}
	if err := u.etRepo.Create(ctx, et); err != nil {
		if errors.Is(err, repo.ErrConflict) {
			return "", u.errHandler.InternalTrouble(err, "uuid generation conflict, email token already exists")
		}
		if errors.Is(err, repo.ErrNotFound) {
			return "", u.errHandler.InternalTrouble(err, "user not found", "userID", userID)
		}
		return "", u.errHandler.InternalTrouble(err, "failed to create email token", "userID", userID)
	}
	return et.ID, nil
}

func (u *UseCase) useEmailToken(ctx context.Context, tokenID string) error {
	if err := u.etRepo.Use(ctx, tokenID); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return u.errHandler.BadRequest(err, "email token not found", "token", tokenID)
		}
		return u.errHandler.InternalTrouble(err, "failed to update email token", "token", tokenID)
	}
	return nil
}

func (u *UseCase) getEmailToken(ctx context.Context, tokenID string) (*dto.EmailToken, error) {
	token, err := u.etRepo.GetByID(ctx, tokenID)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, u.errHandler.BadRequest(err, "email token not found", "tokenID", tokenID)
		}
		return nil, u.errHandler.InternalTrouble(err, "failed to get email token", "tokenID", tokenID)
	}
	if token.UsedAt != nil {
		return nil, u.errHandler.BadRequest(err, "email token already used", "token", tokenID)
	}
	if token.ExpiredAt.Unix() <= time.Now().Unix() {
		return nil, u.errHandler.BadRequest(err, "email token is expired", "token", tokenID)
	}
	return token, nil

}

func (u *UseCase) updateUser(ctx context.Context, dto *dto.UserUpdate) error {
	if err := u.userRepo.Update(ctx, dto); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return u.errHandler.BadRequest(err, "user not found", "userID", dto.ID)
		}
		return u.errHandler.InternalTrouble(err, "failed to update user", "userID", dto.ID)
	}
	return nil
}

func (u *UseCase) getUserByEmail(ctx context.Context, email string) (*dto.User, error) {
	user, err := u.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, u.errHandler.Ok(err, "user not found", "email", email)
		}
		return nil, u.errHandler.InternalTrouble(err, "failed to get user", "email", email)
	}
	return user, err
}
