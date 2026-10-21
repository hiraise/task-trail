package access

import (
	"context"
	"strings"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service/password"
)

// RegistrationService создаёт первый аккаунт сервиса — он же администратор (ADR-0014,
// ADR-0016). Остальные аккаунты приходят по приглашению.
type RegistrationService struct {
	txManager          transaction.TxManager
	userRepository     repository.UserRepository
	userFactory        *factory.UserFactory
	pwdHasher          password.PasswordHasher
	settingsRepository repository.SettingsRepository
	sessions           *sessionOpener
}

func (s *RegistrationService) Execute(ctx context.Context, data dto.Register) (dto.Session, error) {
	// Хеш считается до транзакции: bcrypt медленный, а блокировку регистрации держим недолго
	hash, err := s.pwdHasher.HashPassword(data.Password)
	if err != nil {
		return dto.Session{}, err
	}
	var session dto.Session
	f := func(ctx context.Context) error {
		if err := s.userRepository.LockRegistration(ctx); err != nil {
			return err
		}
		exists, err := s.userRepository.Any(ctx)
		if err != nil {
			return err
		}
		if exists {
			return domain.ErrRegistrationClosed("email", data.Email)
		}
		user := s.userFactory.New(entity.NewEmail(data.Email), hash, data.Username)
		user.IsAdmin = true
		if err := s.userRepository.Create(ctx, user); err != nil {
			return err
		}
		// Адрес сервиса — без «/» в конце: от него строятся ссылки (ADR-0015)
		if err := s.settingsRepository.SetServiceURL(ctx, strings.TrimRight(data.ServiceURL, "/")); err != nil {
			return err
		}
		tokens, err := s.sessions.open(ctx, user.ID)
		if err != nil {
			return err
		}
		session = dto.Session{User: user, Tokens: tokens}
		return nil
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return dto.Session{}, err
	}
	return session, nil
}
