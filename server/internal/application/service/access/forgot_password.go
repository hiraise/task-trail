package access

import (
	"context"

	"task-trail/internal/application/letter"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// ForgotPasswordService sends the password reset email within the request: if it fails,
// the error is in the response, not only in the log (ADR-0017). Without mail, the administrator issues the link.
type ForgotPasswordService struct {
	userRepository     repository.UserRepository
	settingsRepository repository.SettingsRepository
	links              *resetLinkIssuer
	mailer             service.Mailer
}

func (s *ForgotPasswordService) Execute(ctx context.Context, email string) error {
	mail, err := s.settingsRepository.GetMail(ctx)
	if err != nil {
		return err
	}
	if mail == nil {
		return domain.ErrMailDisabled("reason", "password reset requested")
	}
	user, err := s.userRepository.GetByEmail(ctx, entity.NewEmail(email))
	if isEntityNotFound(err) {
		// The response is the same as after sending: it does not reveal whether the email exists
		return nil
	}
	if err != nil {
		return err
	}
	link, reset, err := s.links.issue(ctx, user.ID)
	if err != nil {
		return err
	}
	return s.mailer.Send(ctx, mail, letter.PasswordReset(user.Email, link.URL, reset.Lifetime()))
}
