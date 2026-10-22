// Package link строит ссылки на страницы веба от адреса сервиса (ADR-0015): из писем
// и из ответов API. Адреса страниц — в описании контракта api/openapi.yaml.
package link

import (
	"net/url"

	"task-trail/internal/domain/entity"
)

const (
	passwordResetPath = "/auth/reset"
	invitationPath    = "/auth/invite"
	projectPath       = "/projects/"
)

// PasswordReset — страница сброса пароля; веб берёт токен из параметра token.
func PasswordReset(serviceURL, token string) string {
	return serviceURL + passwordResetPath + "?token=" + url.QueryEscape(token)
}

// Invitation — страница приглашения; веб берёт токен из параметра token.
func Invitation(serviceURL, token string) string {
	return serviceURL + invitationPath + "?token=" + url.QueryEscape(token)
}

// Project — страница проекта.
func Project(serviceURL string, id entity.ProjectID) string {
	return serviceURL + projectPath + url.PathEscape(string(id))
}
