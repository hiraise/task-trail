package api

import (
	"context"
	"task-trail/internal/pkg/logger"
	"task-trail/internal/pkg/smtp"
	"task-trail/internal/pkg/uuid"
	"task-trail/internal/repo"
)

type SmtpNotificationRepo struct {
	sender           smtp.Sender
	logger           logger.Logger
	uuidGenerator    uuid.Generator
	verificationUrl  string
	resetPasswordURL string
}

func NewSmtpNotificationRepo(
	sender smtp.Sender,
	logger logger.Logger,
	uuidGenerator uuid.Generator,
	verificationUrl string,
	resetPasswordURL string,
) *SmtpNotificationRepo {
	return &SmtpNotificationRepo{
		sender:           sender,
		logger:           logger,
		uuidGenerator:    uuidGenerator,
		verificationUrl:  verificationUrl,
		resetPasswordURL: resetPasswordURL,
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

func (r *SmtpNotificationRepo) send(msg smtp.Message) error {
	eventID := r.uuidGenerator.Generate()
	if err := r.sender.Send(msg, eventID); err != nil {
		return repo.Wrap(repo.ErrInternal, err)
	}
	return nil
}
