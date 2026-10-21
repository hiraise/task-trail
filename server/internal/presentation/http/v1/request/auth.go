package request

import (
	"encoding/json"
	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

// Пароль — от 8 символов и не длиннее 72 байт в UTF-8: дальше bcrypt не считает (контракт, Password).
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

// normalizer приводит поля к виду, в котором их проверяют и хранят, например почту
// без пробелов по краям: « Ivan@Example.com » — верная почта, а не ошибка проверки.
type normalizer interface {
	normalize()
}

// validate разбирает тело JSON (лишние поля — ошибка), приводит поля к норме и проверяет их.
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
