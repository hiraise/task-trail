// Package link builds links to web pages from the service address (ADR-0015): for emails
// and API responses. Page addresses are described in the contract api/openapi.yaml.
package link

import (
	"net/url"

	"task-trail/internal/domain/entity"
)

const (
	passwordResetPath = "/auth/reset"
	invitationPath    = "/auth/invite"
	projectPath       = "/projects/"
	taskPath          = "/tasks/"
	profilePath       = "/profile"
)

// PasswordReset is the password reset page; the web takes the token from the token parameter.
func PasswordReset(serviceURL, token string) string {
	return serviceURL + passwordResetPath + "?token=" + url.QueryEscape(token)
}

// Invitation is the invitation page; the web takes the token from the token parameter.
func Invitation(serviceURL, token string) string {
	return serviceURL + invitationPath + "?token=" + url.QueryEscape(token)
}

// Project is the project page.
func Project(serviceURL string, id entity.ProjectID) string {
	return serviceURL + projectPath + url.PathEscape(string(id))
}

// Task is the task page.
func Task(serviceURL string, id entity.TaskID) string {
	return serviceURL + taskPath + url.PathEscape(string(id))
}

// Profile is the user's profile page: notification emails are switched off there (ADR-0038).
func Profile(serviceURL string) string {
	return serviceURL + profilePath
}
