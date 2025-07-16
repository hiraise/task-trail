package dto

// request

type Credentials struct {
	Email    string
	Password string
}

type UserCreate struct {
	Email        string
	PasswordHash string
	IsVerified   bool
}

type PasswordChange struct {
	UserID      int
	OldPassword string
	NewPassword string
}

type PasswordReset struct {
	TokenID     string
	NewPassword string
}

// Response

type LoginRes struct {
	UserID int
	AT     *AccessTokenRes
	RT     *RefreshTokenRes
}

type RefreshRes struct {
	AT *AccessTokenRes
	RT *RefreshTokenRes
}
