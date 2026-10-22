package entity

import (
	"strings"
	"task-trail/internal/domain"
	"task-trail/internal/domain/service/password"
	"time"
)

type UserID string

type Email string

// NewEmail lowercases the email and trims surrounding spaces — before comparison
// and before saving (ADR-0016): so Ivan@Example.com and ivan@example.com are one account.
func NewEmail(raw string) Email {
	return Email(strings.ToLower(strings.TrimSpace(raw)))
}

type UserAccount struct {
	ID           UserID
	Email        Email
	PasswordHash string
	Username     *string
	// AvatarID — the avatar file ID (ADR-0013) or nil.
	AvatarID *FileID
	// IsAdmin — a service administrator (ADR-0014).
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

// ResetPassword sets the password by a reset link: the person does not remember the old password, so
// a match with it is not checked.
func (u *UserAccount) ResetPassword(newPassword string, pwdHasher password.PasswordHasher, now time.Time) error {
	newHash, err := pwdHasher.HashPassword(newPassword)
	if err != nil {
		return err
	}
	u.PasswordHash = newHash
	u.UpdatedAt = now
	return nil
}

// Rename changes the name; nil — no name, others see the email (DisplayName).
func (u *UserAccount) Rename(username *string, now time.Time) {
	u.Username = username
	u.UpdatedAt = now
}

// ReplaceAvatar sets a new avatar and returns the previous one or nil: it is no longer needed,
// its file is marked deleted (ADR-0013).
func (u *UserAccount) ReplaceAvatar(fileID FileID, now time.Time) (previous *FileID) {
	previous = u.AvatarID
	u.AvatarID = &fileID
	u.UpdatedAt = now
	return previous
}

// SetAdmin grants or removes service administrator rights (ADR-0014). admins — how many
// administrators the service has now: the last one cannot be removed, LAST_ADMIN. Count them
// under UserRepository.LockAdmins, otherwise two concurrent removals leave the service without administrators.
func (u *UserAccount) SetAdmin(isAdmin bool, admins int, now time.Time) error {
	if u.IsAdmin == isAdmin {
		return nil
	}
	if !isAdmin && admins <= 1 {
		return domain.ErrLastAdmin("userID", u.ID)
	}
	u.IsAdmin = isAdmin
	u.UpdatedAt = now
	return nil
}

// DisplayName — how to name the person to others: the name, or the email if there is none.
func DisplayName(username *string, email Email) string {
	if username != nil && *username != "" {
		return *username
	}
	return string(email)
}
