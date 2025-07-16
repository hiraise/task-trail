package api

import (
	"context"
	"fmt"
	"strconv"
	"task-trail/internal/pkg/logger"
	"task-trail/internal/pkg/smtp"
	"task-trail/internal/pkg/uuid"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

type SmtpNotificationRepo struct {
	sender           smtp.Sender
	logger           logger.Logger
	uuidGenerator    uuid.Generator
	verificationUrl  string
	resetPasswordURL string
	projectURL       string
}

func NewSmtpNotificationRepo(
	sender smtp.Sender,
	logger logger.Logger,
	uuidGenerator uuid.Generator,
	verificationUrl string,
	resetPasswordURL string,
	projectURL string,
) *SmtpNotificationRepo {
	return &SmtpNotificationRepo{
		sender:           sender,
		logger:           logger,
		uuidGenerator:    uuidGenerator,
		verificationUrl:  verificationUrl,
		resetPasswordURL: resetPasswordURL,
		projectURL:       projectURL,
	}
}

func (r *SmtpNotificationRepo) SendVerificationEmail(ctx context.Context, email string, token string) error {
	msg := smtp.Message{
		Recipients: []string{email},
		Subject:    "Account Verification",
		Text:       r.verificationUrl + token + "&email=" + email,
	}
	return r.send(msg)
}

func (r *SmtpNotificationRepo) SendResetPasswordEmail(ctx context.Context, email string, token string) error {
	msg := smtp.Message{
		Recipients: []string{email},
		Subject:    "Reset password",
		Text:       r.resetPasswordURL + token,
	}
	return r.send(msg)
}

func (r *SmtpNotificationRepo) SendAutoRegisterEmail(ctx context.Context, email string) error {
	msg := smtp.Message{
		Recipients: []string{email},
		Subject:    "Welcome to Task Trail",
		Text:       "Welcome! You was automaticly registered. To enter in app, use reset password form on main page",
	}
	return r.send(msg)
}

func (r *SmtpNotificationRepo) SendInvintationInProject(ctx context.Context, data *dto.NotificationProjectInvite) error {
	url := r.projectURL + strconv.Itoa(data.ProjectID)
	msg := smtp.Message{
		Recipients: data.Recipients,
		Subject:    fmt.Sprintf("Welcome to project: %s", data.ProjectName),
		Text:       fmt.Sprintf("Hello! You have been invited to the project \"%s\". Follow the link to get to the project: %s", data.ProjectName, url),
	}
	return r.send(msg)
}
func (r *SmtpNotificationRepo) send(msg smtp.Message) error {
	eventID := r.uuidGenerator.Generate()
	if err := r.sender.Send(msg, eventID); err != nil {
		return repo.Wrap(repo.ErrInternal, err)
	}
	return nil
}
