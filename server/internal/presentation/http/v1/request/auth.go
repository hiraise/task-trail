package request

import (
	"encoding/json"
	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

// A password is at least 8 characters and at most 72 bytes in UTF-8: bcrypt ignores the rest (contract, Password).
type registerReq struct {
	Email      string `json:"email" binding:"required,email,max=254"`
	Password   string `json:"password" binding:"required,min=8,maxbytes=72"`
	Username   string `json:"username" binding:"required,max=100"`
	ServiceURL string `json:"serviceUrl" binding:"required,httpurl"`
}

func (r *registerReq) normalize() { r.Email = string(entity.NewEmail(r.Email)) }

type credentials struct {
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password" binding:"required,min=8,maxbytes=72"`
}

func (r *credentials) normalize() { r.Email = string(entity.NewEmail(r.Email)) }

type changePasswordReq struct {
	OldPassword string `json:"oldPassword" binding:"required,min=8,maxbytes=72"`
	NewPassword string `json:"newPassword" binding:"required,min=8,maxbytes=72"`
}

type forgotPasswordReq struct {
	Email string `json:"email" binding:"required,email,max=254"`
}

func (r *forgotPasswordReq) normalize() { r.Email = string(entity.NewEmail(r.Email)) }

type resetPasswordReq struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8,maxbytes=72"`
}

type invitationTokenReq struct {
	Token string `json:"token" binding:"required"`
}

type acceptInvitationReq struct {
	Token    string `json:"token" binding:"required"`
	Username string `json:"username" binding:"required,max=100"`
	Password string `json:"password" binding:"required,min=8,maxbytes=72"`
}

func BindRegister(c *gin.Context) (dto.Register, error) {
	body, err := validate[registerReq](c)
	if err != nil {
		return dto.Register{}, err
	}
	return dto.Register{Email: body.Email, Password: body.Password, Username: body.Username, ServiceURL: body.ServiceURL}, nil
}

func BindCredentials(c *gin.Context) (dto.Credentials, error) {
	body, err := validate[credentials](c)
	if err != nil {
		return dto.Credentials{}, err
	}
	return dto.Credentials{Email: body.Email, Password: body.Password}, nil
}

func BindChangePassword(c *gin.Context) (dto.ChangePassword, error) {
	body, err := validate[changePasswordReq](c)
	if err != nil {
		return dto.ChangePassword{}, err
	}
	return dto.ChangePassword{OldPassword: body.OldPassword, NewPassword: body.NewPassword}, nil
}

// BindForgotPassword returns the normalized email.
func BindForgotPassword(c *gin.Context) (string, error) {
	body, err := validate[forgotPasswordReq](c)
	if err != nil {
		return "", err
	}
	return body.Email, nil
}

func BindResetPassword(c *gin.Context) (dto.ResetPassword, error) {
	body, err := validate[resetPasswordReq](c)
	if err != nil {
		return dto.ResetPassword{}, err
	}
	return dto.ResetPassword{Token: body.Token, Password: body.Password}, nil
}

// BindInvitationToken returns the token from the invitation link.
func BindInvitationToken(c *gin.Context) (string, error) {
	body, err := validate[invitationTokenReq](c)
	if err != nil {
		return "", err
	}
	return body.Token, nil
}

func BindAcceptInvitation(c *gin.Context) (dto.AcceptInvitation, error) {
	body, err := validate[acceptInvitationReq](c)
	if err != nil {
		return dto.AcceptInvitation{}, err
	}
	return dto.AcceptInvitation{Token: body.Token, Username: body.Username, Password: body.Password}, nil
}

// normalizer brings fields to the form in which they are validated and stored, e.g. an email
// without surrounding spaces: " Ivan@Example.com " is a valid email, not a validation error.
type normalizer interface {
	normalize()
}

// validate parses the JSON body (unknown fields are an error), normalizes the fields and validates them.
func validate[T any](c *gin.Context) (*T, error) {
	var body T
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&body); err != nil {
		// offset is 2 to skip 'validate' and 'Bind...' functions
		return nil, domain.ErrInputValidation(2, err)
	}
	if n, ok := any(&body).(normalizer); ok {
		n.normalize()
	}
	if err := binding.Validator.ValidateStruct(&body); err != nil {
		return nil, domain.ErrInputValidation(2, err)
	}
	return &body, nil
}
