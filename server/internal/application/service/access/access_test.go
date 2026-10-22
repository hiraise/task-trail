package access_test

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"task-trail/internal/application/service/access"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/service"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/infrastructure/service/linktoken"
	"task-trail/test/clock"
	"task-trail/test/mocks"
	"task-trail/test/txtest"

	"go.uber.org/mock/gomock"
)

const (
	userID       = entity.UserID("0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c")
	tokenID      = entity.RefreshTokenID("8a3e1f40-2b8c-4d6e-9f1a-3c5b7d9e0f12")
	email        = entity.Email("ivan@example.com")
	passwordHash = "$2a$12$hash"
	rtLifetime   = 30 * 24 * time.Hour
	// resetLifetime is the lifetime of a password reset link
	resetLifetime = 24 * time.Hour
)

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

type deps struct {
	tx          *mocks.MockTxManager
	users       *mocks.MockUserRepository
	tokens      *mocks.MockRefreshTokenRepository
	settings    *mocks.MockSettingsRepository
	passwords   *mocks.MockPasswordService
	jwt         *mocks.MockAccessTokenService
	resets      *mocks.MockPasswordResetRepository
	invitations *mocks.MockInvitationRepository
	members     *mocks.MockProjectMemberRepository
	mailer      *mocks.MockMailer
}

func newModule(t *testing.T) (*access.AccessModule, *deps) {
	ctrl := gomock.NewController(t)
	d := &deps{
		tx:          mocks.NewMockTxManager(ctrl),
		users:       mocks.NewMockUserRepository(ctrl),
		tokens:      mocks.NewMockRefreshTokenRepository(ctrl),
		settings:    mocks.NewMockSettingsRepository(ctrl),
		passwords:   mocks.NewMockPasswordService(ctrl),
		jwt:         mocks.NewMockAccessTokenService(ctrl),
		resets:      mocks.NewMockPasswordResetRepository(ctrl),
		invitations: mocks.NewMockInvitationRepository(ctrl),
		members:     mocks.NewMockProjectMemberRepository(ctrl),
		mailer:      mocks.NewMockMailer(ctrl),
	}
	clk := clock.New(now)
	idGen := id.New()
	userFactory := factory.NewUserFactory(idGen, clk)
	rtFactory := factory.NewRTFactory(idGen, clk, rtLifetime)
	module := access.New(access.Deps{
		TxManager:            d.tx,
		Clock:                clk,
		UserRepo:             d.users,
		UserFactory:          userFactory,
		PasswordService:      d.passwords,
		RefreshTokenFactory:  rtFactory,
		RefreshTokenRepo:     d.tokens,
		AccessTokenService:   d.jwt,
		SettingsRepo:         d.settings,
		PasswordResetFactory: factory.NewPasswordResetFactory(linktoken.New(), clk, resetLifetime),
		PasswordResetRepo:    d.resets,
		InvitationRepo:       d.invitations,
		ProjectMemberRepo:    d.members,
		Mailer:               d.mailer,
	})
	return module, d
}

// expectTx runs the transaction callback with a mark in the context: it shows
// which calls ran inside the transaction (inTx) and which after it (outsideTx).
func (d *deps) expectTx() {
	txtest.Expect(d.tx)
}

var (
	inTx      = txtest.InTx
	outsideTx = txtest.OutsideTx
)

// expectSession expects a new token pair: the new refresh token is written to the database.
func (d *deps) expectSession() {
	d.tokens.EXPECT().Create(inTx, gomock.Any()).DoAndReturn(func(_ context.Context, rt *entity.RefreshToken) error {
		if rt.UserID != userID || !rt.ExpiredAt.Equal(now.Add(rtLifetime)) || rt.RotatedAt != nil || rt.RevokedAt != nil {
			return fmt.Errorf("new refresh token: %+v", rt)
		}
		return nil
	})
	d.jwt.EXPECT().GenerateTokensPair(userID, gomock.Any()).Return(issued("access"), issued("refresh"), nil)
}

func issued(token string) service.IssuedToken {
	return service.IssuedToken{Token: token, ExpiredAt: now}
}

func user() *entity.UserAccount {
	return &entity.UserAccount{ID: userID, Email: email, PasswordHash: passwordHash}
}

func requireCode(t *testing.T, err error, code domain.ErrorCode) {
	t.Helper()
	var e *domain.DomainError
	if !errors.As(err, &e) || e.Code != code {
		t.Fatalf("expected error %s, got %v", code, err)
	}
}
