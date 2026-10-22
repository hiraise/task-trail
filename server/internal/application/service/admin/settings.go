package admin

import (
	"context"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/letter"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// GetSettingsService returns the service address and mail settings; the SMTP password is not returned, only
// a flag that it is saved (ADR-0015).
type GetSettingsService struct {
	settings repository.SettingsRepository
}

func (s *GetSettingsService) Execute(ctx context.Context) (dto.ServiceSettings, error) {
	return current(ctx, s.settings)
}

// UpdateServiceURLService changes the service address: links in emails and API responses are built
// from it (ADR-0015). Links issued earlier lead to the previous address.
type UpdateServiceURLService struct {
	settings repository.SettingsRepository
}

func (s *UpdateServiceURLService) Execute(ctx context.Context, serviceURL string) (dto.ServiceSettings, error) {
	if err := s.settings.SetServiceURL(ctx, entity.NewServiceURL(serviceURL)); err != nil {
		return dto.ServiceSettings{}, err
	}
	return current(ctx, s.settings)
}

// SaveMailService configures mail or changes its settings (ADR-0017). Settings are saved
// only if connecting to SMTP with them succeeded. There is no transaction: the check takes up to 10 seconds,
// and concurrent saves do not mix anyway: each writes the whole settings, and the saved
// password is used only with the server and port it was entered for.
type SaveMailService struct {
	settings repository.SettingsRepository
	mailer   service.Mailer
}

func (s *SaveMailService) Execute(ctx context.Context, data dto.MailSettings) (dto.ServiceSettings, error) {
	mail := &entity.MailSettings{
		Host:       data.Host,
		Port:       data.Port,
		Encryption: data.Encryption,
		Sender:     data.Sender,
		Username:   data.Username,
		Password:   data.Password,
	}
	if mail.Username == nil {
		// Without SMTP authentication no password is needed: neither entered nor saved
		mail.Password = nil
	} else if !data.PasswordSet {
		saved, err := s.settings.GetMail(ctx)
		if err != nil {
			return dto.ServiceSettings{}, err
		}
		if err := mail.KeepPassword(saved); err != nil {
			return dto.ServiceSettings{}, err
		}
	}
	if err := s.mailer.Check(ctx, mail); err != nil {
		return dto.ServiceSettings{}, err
	}
	if err := s.settings.SaveMail(ctx, mail); err != nil {
		return dto.ServiceSettings{}, err
	}
	return current(ctx, s.settings)
}

// DisableMailService disables mail: the SMTP settings and password are deleted (ADR-0017).
type DisableMailService struct {
	settings repository.SettingsRepository
}

func (s *DisableMailService) Execute(ctx context.Context) error {
	return s.settings.DeleteMail(ctx)
}

// SendTestMailService sends a test email to the administrator who requested it
// (ADR-0017). Without mail: MAIL_DISABLED; an SMTP rejection: MAIL_SEND_FAILED.
type SendTestMailService struct {
	users    repository.UserRepository
	settings repository.SettingsRepository
	mailer   service.Mailer
}

func (s *SendTestMailService) Execute(ctx context.Context, adminID string) error {
	mail, err := s.settings.GetMail(ctx)
	if err != nil {
		return err
	}
	if mail == nil {
		return domain.ErrMailDisabled("reason", "test letter requested")
	}
	admin, err := s.users.GetByID(ctx, entity.UserID(adminID))
	if domain.HasCode(err, domain.EntityNotFound) {
		// The administrator was deleted but the access token is still alive: the session is invalid
		return domain.ErrWrongAccessToken("userID", adminID, "reason", "user not found")
	}
	if err != nil {
		return err
	}
	return s.mailer.Send(ctx, mail, letter.MailTest(admin.Email))
}
