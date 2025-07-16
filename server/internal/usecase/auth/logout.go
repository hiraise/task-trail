package auth

import "context"

func (u *UseCase) Logout(ctx context.Context, refreshToken string) error {
	userID, tokenID, err := u.verifyRT(ctx, refreshToken)
	if err != nil {
		return err
	}
	return u.revokeRT(ctx, tokenID, userID)
}
