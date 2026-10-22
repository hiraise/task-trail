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

// mailSettingsReq — MailSettingsRequest в контракте. Пароль не передан — остаётся
// сохранённый, null — удалить пароль.
type mailSettingsReq struct {
	Host       string           `json:"host" binding:"required"`
	Port       int              `json:"port" binding:"required,min=1,max=65535"`
	Encryption string           `json:"encryption" binding:"required,oneof=none starttls tls"`
	Sender     string           `json:"sender" binding:"required,mailbox"`
	Username   *string          `json:"username" binding:"omitnil,min=1"`
	Password   Optional[string] `json:"password" binding:"omitnil,min=1"`
}

// normalize убирает пробелы по краям, которые приносит копирование: с ними адрес сервера
// не найдётся, а ошибка подключения не подскажет почему.
func (r *mailSettingsReq) normalize() {
	r.Host = strings.TrimSpace(r.Host)
	r.Sender = strings.TrimSpace(r.Sender)
}

type updateAdminUserReq struct {
	// Указатель: required у bool не пропустил бы false
	IsAdmin *bool `json:"isAdmin" binding:"required"`
}

// mailbox — отправитель письма, который примет go-mail: «noreply@example.com» или
// «TaskTrail <noreply@example.com>». Иначе подключение пройдёт проверку, а письма не уйдут.
func mailbox(fl validator.FieldLevel) bool {
	_, err := mail.ParseAddress(fl.Field().String())
	return err == nil
}

// BindUpdateServiceSettings возвращает новый адрес сервиса.
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

// BindUpdateAdminUser возвращает, должен ли пользователь быть администратором сервиса.
func BindUpdateAdminUser(c *gin.Context) (bool, error) {
	body, err := validate[updateAdminUserReq](c)
	if err != nil {
		return false, err
	}
	return *body.IsAdmin, nil
}
