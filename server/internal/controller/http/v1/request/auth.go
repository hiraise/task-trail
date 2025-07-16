package request

import (
	"task-trail/internal/usecase/dto"

	"github.com/gin-gonic/gin"
)

type credentials struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=50"`
}

type changePasswordReq struct {
	OldPassword string `json:"oldPassword" binding:"required,min=8,max=50"`
	NewPassword string `json:"newPassword" binding:"required,min=8,max=50"`
}

type resetPasswordReq struct {
	Token    string `json:"token" binding:"required,uuid"`
	Password string `json:"password" binding:"required,min=8,max=50"`
}

type emailReq struct {
	Email string `json:"email" binding:"required,email"`
}

type verifyReq struct {
	Token string `json:"token" binding:"required,uuid"`
}

// BindChangePasswordDTO binds and validates the payload from the Gin context.
// UserID required for build DTO
// Returns PasswordChange DTO if ok, or an error if the request payload is invalid or binding fails.
func BindChangePasswordDTO(c *gin.Context, userID int) (*dto.PasswordChange, error) {
	body, err := validate[changePasswordReq](c)
	if err != nil {
		return nil, err
	}
	return &dto.PasswordChange{UserID: userID, OldPassword: body.OldPassword, NewPassword: body.NewPassword}, nil
}

// BindResetPasswordDTO binds and validates the payload from the Gin context.
// Returns PasswordReset DTO if ok, or an error if the request payload is invalid or binding fails.
func BindResetPasswordDTO(c *gin.Context) (*dto.PasswordReset, error) {
	body, err := validate[resetPasswordReq](c)
	if err != nil {
		return nil, err
	}
	return &dto.PasswordReset{TokenID: body.Token, NewPassword: body.Password}, nil
}

// BindEmail binds and validates the payload from the Gin context.
// Returns the email as a string if ok, or an error if the request payload is invalid or binding fails.
func BindEmail(c *gin.Context) (string, error) {
	body, err := validate[emailReq](c)
	if err != nil {
		return "", err
	}
	return body.Email, nil
}

// BindEmail binds and validates the payload from the Gin context.
// Returns the verification token as a string if ok, or an error if the request payload is invalid or binding fails.
func BindVerifyToken(c *gin.Context) (string, error) {
	body, err := validate[verifyReq](c)
	if err != nil {
		return "", err
	}
	return body.Token, nil
}

// BindCredentialsDTO binds and validates the payload from the Gin context.
// Returns Credentials DTO if ok, or an error if the request payload is invalid or binding fails.
func BindCredentialsDTO(c *gin.Context) (*dto.Credentials, error) {
	body, err := validate[credentials](c)
	if err != nil {
		return nil, err
	}
	return &dto.Credentials{Email: body.Email, Password: body.Password}, nil
}

func validate[T any](c *gin.Context) (*T, error) {
	var body T
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		return nil, err
	}
	return &body, nil
}
