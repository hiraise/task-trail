package auth

import "context"

func (u *UseCase) Logout(ctx context.Context, rt string) error {
	userID, tokenID, err := u.verifyRT(ctx, rt)
	if err != nil {
		return err
	}
	return u.revokeRT(ctx, tokenID, userID)
}
