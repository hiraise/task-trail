package notification

import (
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/infrastructure/service/notification/provider/email"
)

type AccessNotifier struct {
	sender           *email.GomailSender
	uuidGenerator    *id.UUIDGenerator
	verificationUrl  string
	resetPasswordURL string
}

func NewSmtpAccessNotifier(
	sender *email.GomailSender,
	uuidGenerator *id.UUIDGenerator,
	verificationUrl string,
	resetPasswordURL string,
) *AccessNotifier {
	return &AccessNotifier{
		sender:           sender,
		uuidGenerator:    uuidGenerator,
		verificationUrl:  verificationUrl,
		resetPasswordURL: resetPasswordURL,
	}
}
func (r *AccessNotifier) SendAccountConfirmation(e entity.Email, tokenID entity.ConfirmationTokenID) error {
	msg := email.Message{
		Recipients: []string{string(e)},
		Subject:    "Account Confirmation",
		Text:       r.verificationUrl + string(tokenID) + "&email=" + string(e),
	}
	return r.send(msg)
}
func (r *AccessNotifier) SendPasswordResetConfirmation(e entity.Email, tokenID entity.ConfirmationTokenID) error {
	msg := email.Message{
		Recipients: []string{string(e)},
		Subject:    "Reset password",
		Text:       r.resetPasswordURL + string(tokenID),
	}
	return r.send(msg)
}

func (r *AccessNotifier) send(msg email.Message) error {
	eventID := r.uuidGenerator.Generate()
	if err := r.sender.Send(msg, eventID); err != nil {
		return domain.ErrNotificationFailed(err)
	}
	return nil
}
