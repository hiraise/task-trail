package request

import (
	"net/mail"
	"strings"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type updateServiceSettingsReq struct {
	ServiceURL string `json:"serviceUrl" binding:"required,httpurl"`
}

// mailSettingsReq is MailSettingsRequest in the contract. Password omitted — the saved one
// stays; null — delete the password.
type mailSettingsReq struct {
	Host       string           `json:"host" binding:"required"`
	Port       int              `json:"port" binding:"required,min=1,max=65535"`
	Encryption string           `json:"encryption" binding:"required,oneof=none starttls tls"`
	Sender     string           `json:"sender" binding:"required,mailbox"`
	Username   *string          `json:"username" binding:"omitnil,min=1"`
	Password   Optional[string] `json:"password" binding:"omitnil,min=1"`
}

// normalize trims surrounding spaces that copy-paste brings: with them the server address
// is not found, and the connection error would not tell why.
func (r *mailSettingsReq) normalize() {
	r.Host = strings.TrimSpace(r.Host)
	r.Sender = strings.TrimSpace(r.Sender)
}

type updateAdminUserReq struct {
	// A pointer: required on a bool would reject false
	IsAdmin *bool `json:"isAdmin" binding:"required"`
}

// mailbox is a mail sender go-mail accepts: "noreply@example.com" or
// "TaskTrail <noreply@example.com>". Otherwise the connection check passes but mail is not sent.
func mailbox(fl validator.FieldLevel) bool {
	_, err := mail.ParseAddress(fl.Field().String())
	return err == nil
}

// BindUpdateServiceSettings returns the new service address.
func BindUpdateServiceSettings(c *gin.Context) (string, error) {
	body, err := validate[updateServiceSettingsReq](c)
	if err != nil {
		return "", err
	}
	return body.ServiceURL, nil
}

func BindMailSettings(c *gin.Context) (dto.MailSettings, error) {
	body, err := validate[mailSettingsReq](c)
	if err != nil {
		return dto.MailSettings{}, err
	}
	return dto.MailSettings{
		Host:        body.Host,
		Port:        body.Port,
		Encryption:  entity.MailEncryption(body.Encryption),
		Sender:      body.Sender,
		Username:    body.Username,
		PasswordSet: body.Password.Set,
		Password:    body.Password.Value,
	}, nil
}

// BindUpdateAdminUser returns whether the user should be a service administrator.
func BindUpdateAdminUser(c *gin.Context) (bool, error) {
	body, err := validate[updateAdminUserReq](c)
	if err != nil {
		return false, err
	}
	return *body.IsAdmin, nil
}
