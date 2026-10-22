package entity

import (
	"strings"
	"task-trail/internal/domain"
	"task-trail/internal/domain/service/password"
	"time"
)

type UserID string

type Email string

// NewEmail приводит почту к нижнему регистру и обрезает пробелы по краям — до сравнения
// и до записи (ADR-0016): так Ivan@Example.com и ivan@example.com — один аккаунт.
func NewEmail(raw string) Email {
	return Email(strings.ToLower(strings.TrimSpace(raw)))
}

type UserAccount struct {
	ID           UserID
	Email        Email
	PasswordHash string
	Username     *string
	// AvatarID — ID файла аватарки (ADR-0013) или nil.
	AvatarID *FileID
	// IsAdmin — администратор сервиса (ADR-0014).
	IsAdmin    bool
	VerifiedAt *time.Time
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (u *UserAccount) VerifyOldPassword(pwd string, pwdService password.PasswordService) error {
	equal, err := pwdService.ComparePassword(pwd, u.PasswordHash)
	if err != nil {
		return err
	}
	if !equal {
		return domain.ErrWrongPassword("userID", u.ID)
	}
	return nil
}

func (u *UserAccount) ChangePassword(newPassword string, pwdService password.PasswordService, now time.Time) error {
	equal, err := pwdService.ComparePassword(newPassword, u.PasswordHash)
	if err != nil {
		return err
	}
	if equal {
		return domain.ErrPasswordSameAsOld("userID", u.ID)
	}
	newHash, err := pwdService.HashPassword(newPassword)
	if err != nil {
		return err
	}
	u.PasswordHash = newHash
	u.UpdatedAt = now
	return nil
}

// ResetPassword задаёт пароль по ссылке сброса: старый пароль человек не помнит, поэтому
// и совпадение с ним не проверяется.
func (u *UserAccount) ResetPassword(newPassword string, pwdHasher password.PasswordHasher, now time.Time) error {
	newHash, err := pwdHasher.HashPassword(newPassword)
	if err != nil {
		return err
	}
	u.PasswordHash = newHash
	u.UpdatedAt = now
	return nil
}

// Rename меняет имя; nil — имени нет, другим показывается почта (DisplayName).
func (u *UserAccount) Rename(username *string, now time.Time) {
	u.Username = username
	u.UpdatedAt = now
}

// ReplaceAvatar ставит новую аватарку и возвращает прежнюю или nil: она больше не нужна,
// её файл помечается удалённым (ADR-0013).
func (u *UserAccount) ReplaceAvatar(fileID FileID, now time.Time) (previous *FileID) {
	previous = u.AvatarID
	u.AvatarID = &fileID
	u.UpdatedAt = now
	return previous
}

// DisplayName — как называть человека другим: имя, а если его нет — почта.
func DisplayName(username *string, email Email) string {
	if username != nil && *username != "" {
		return *username
	}
	return string(email)
}
