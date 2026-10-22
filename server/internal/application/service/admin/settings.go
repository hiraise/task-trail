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

// GetSettingsService — адрес сервиса и настройки почты; пароль SMTP не отдаётся, только
// признак, что он сохранён (ADR-0015).
type GetSettingsService struct {
	settings repository.SettingsRepository
}

func (s *GetSettingsService) Execute(ctx context.Context) (dto.ServiceSettings, error) {
	return current(ctx, s.settings)
}

// UpdateServiceURLService меняет адрес сервиса: от него строятся ссылки в письмах и ответах
// API (ADR-0015). Ссылки, выданные раньше, ведут на прежний адрес.
type UpdateServiceURLService struct {
	settings repository.SettingsRepository
}

func (s *UpdateServiceURLService) Execute(ctx context.Context, serviceURL string) (dto.ServiceSettings, error) {
	if err := s.settings.SetServiceURL(ctx, entity.NewServiceURL(serviceURL)); err != nil {
		return dto.ServiceSettings{}, err
	}
	return current(ctx, s.settings)
}

// SaveMailService подключает почту или меняет её настройки (ADR-0017). Настройки сохраняются,
// только если с ними удалось подключиться к SMTP. Транзакции нет: проверка идёт до 10 секунд,
// а встречные сохранения и так не смешиваются — каждое пишет настройки целиком, и сохранённый
// пароль берётся только вместе с сервером и портом, для которых его ввели.
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
		// Без входа на SMTP пароль не нужен: ни введённый, ни сохранённый
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

// DisableMailService отключает почту: настройки SMTP и пароль удаляются (ADR-0017).
type DisableMailService struct {
	settings repository.SettingsRepository
}

func (s *DisableMailService) Execute(ctx context.Context) error {
	return s.settings.DeleteMail(ctx)
}

// SendTestMailService отправляет тестовое письмо на почту администратора, который попросил
// (ADR-0017). Без почты — MAIL_DISABLED, отказ SMTP — MAIL_SEND_FAILED.
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
		// Администратора удалили, а access-токен ещё жив: сессия недействительна
		return domain.ErrWrongAccessToken("userID", adminID, "reason", "user not found")
	}
	if err != nil {
		return err
	}
	return s.mailer.Send(ctx, mail, letter.MailTest(admin.Email))
}
