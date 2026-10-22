package access_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"go.uber.org/mock/gomock"
)

func at(t time.Time) *time.Time { return &t }

func token(rotatedAt, revokedAt *time.Time, expiredAt time.Time) *entity.RefreshToken {
	return &entity.RefreshToken{ID: tokenID, UserID: userID, ExpiredAt: expiredAt, RotatedAt: rotatedAt, RevokedAt: revokedAt}
}

func activeToken() *entity.RefreshToken { return token(nil, nil, now.Add(time.Hour)) }

func (d *deps) expectVerify(rt string) {
	d.jwt.EXPECT().VerifyRefreshToken(rt).Return(string(userID), string(tokenID), nil)
}

// An active token is exchanged once: it is marked as exchanged, and a new pair is issued.
func TestRefreshActiveToken(t *testing.T) {
	module, d := newModule(t)
	d.expectVerify("rt")
	d.expectTx()
	d.tokens.EXPECT().GetForUpdate(inTx, tokenID, userID).Return(activeToken(), nil)
	d.tokens.EXPECT().Update(inTx, gomock.Any()).DoAndReturn(func(_ context.Context, rt *entity.RefreshToken) error {
		if rt.RotatedAt == nil || !rt.RotatedAt.Equal(now) || rt.RevokedAt != nil {
			t.Errorf("exchanged token: %+v", rt)
		}
		return nil
	})
	d.expectSession()

	tokens, err := module.Refresh.Execute(context.Background(), "rt")
	if err != nil {
		t.Fatal(err)
	}
	if tokens.UserID != userID || tokens.RefreshToken.Token != "refresh" {
		t.Fatalf("tokens: %+v", tokens)
	}
}

// The same token within 30 seconds after the exchange is a parallel request from another tab:
// it also gets a new pair, and the exchange time does not move.
func TestRefreshJustRotatedToken(t *testing.T) {
	module, d := newModule(t)
	d.expectVerify("rt")
	d.expectTx()
	d.tokens.EXPECT().GetForUpdate(inTx, tokenID, userID).
		Return(token(at(now.Add(-entity.RefreshTokenReuseGrace)), nil, now.Add(time.Hour)), nil)
	d.expectSession()

	if _, err := module.Refresh.Execute(context.Background(), "rt"); err != nil {
		t.Fatal(err)
	}
}

// Later it is theft: all of the user's tokens are revoked after the transaction, otherwise the revocation
// would roll back along with the error.
func TestRefreshReusedToken(t *testing.T) {
	module, d := newModule(t)
	d.expectVerify("rt")
	d.expectTx()
	d.tokens.EXPECT().GetForUpdate(inTx, tokenID, userID).
		Return(token(at(now.Add(-entity.RefreshTokenReuseGrace-time.Second)), nil, now.Add(time.Hour)), nil)
	d.tokens.EXPECT().RevokeAll(outsideTx, userID, now).Return(nil)

	_, err := module.Refresh.Execute(context.Background(), "rt")
	requireCode(t, err, domain.RefreshTokenReused)
}

// Failing to revoke the tokens after a theft is a server error, not a silent 401.
func TestRefreshReusedTokenRevokeFailed(t *testing.T) {
	module, d := newModule(t)
	d.expectVerify("rt")
	d.expectTx()
	d.tokens.EXPECT().GetForUpdate(inTx, tokenID, userID).
		Return(token(at(now.Add(-time.Hour)), nil, now.Add(time.Hour)), nil)
	d.tokens.EXPECT().RevokeAll(outsideTx, userID, now).Return(domain.ErrRepoInternal(0, errors.New("connection reset")))

	_, err := module.Refresh.Execute(context.Background(), "rt")
	requireCode(t, err, domain.RepoInternal)
}

func TestRefreshRejectedTokens(t *testing.T) {
	cases := []struct {
		name  string
		token *entity.RefreshToken
		err   error
		code  domain.ErrorCode
	}{
		{"session closed", token(nil, at(now.Add(-time.Hour)), now.Add(time.Hour)), nil, domain.RefreshTokenRevoked},
		{"expired", token(nil, nil, now), nil, domain.RefreshTokenExpired},
		{"not in the database", nil, domain.ErrEntityNotFound(0, nil), domain.RefreshTokenNotFound},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			module, d := newModule(t)
			d.expectVerify("rt")
			d.expectTx()
			d.tokens.EXPECT().GetForUpdate(inTx, tokenID, userID).Return(c.token, c.err)

			_, err := module.Refresh.Execute(context.Background(), "rt")
			requireCode(t, err, c.code)
		})
	}
}

func TestRefreshInvalidJWT(t *testing.T) {
	module, d := newModule(t)
	d.jwt.EXPECT().VerifyRefreshToken("rt").Return("", "", domain.ErrWrongRefreshToken())

	_, err := module.Refresh.Execute(context.Background(), "rt")
	requireCode(t, err, domain.RefreshTokenWrong)
}
