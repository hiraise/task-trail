package persistent_test

import (
	"context"
	"testing"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/keys"
	"task-trail/internal/infrastructure/service/secretbox"
	"task-trail/test/testdb"
)

var _ repository.SettingsRepository = (*persistent.PGSettingsRepository)(nil)

func settingsRepo(t *testing.T, secret string) (*persistent.PGSettingsRepository, func(string) *persistent.PGSettingsRepository) {
	t.Helper()
	pool := testdb.New(t)
	withSecret := func(secret string) *persistent.PGSettingsRepository {
		box, err := secretbox.New(keys.Derive(secret, keys.SecretBox))
		if err != nil {
			t.Fatal(err)
		}
		return persistent.NewSettingsRepo(pool, box)
	}
	return withSecret(secret), withSecret
}

func ptr(s string) *string { return &s }

func TestServiceURL(t *testing.T) {
	repo, _ := settingsRepo(t, "0123456789abcdef0123456789abcdef")
	ctx := context.Background()
	if url, err := repo.GetServiceURL(ctx); err != nil || url != "" {
		t.Fatalf("before write: %q, %v; expected an empty address", url, err)
	}
	for _, url := range []string{"http://localhost:3000", "https://example.com/tasktrail"} {
		if err := repo.SetServiceURL(ctx, url); err != nil {
			t.Fatal(err)
		}
		if got, err := repo.GetServiceURL(ctx); err != nil || got != url {
			t.Fatalf("read %q, %v; written %q", got, err, url)
		}
	}
}

func TestMailSettings(t *testing.T) {
	const secret = "0123456789abcdef0123456789abcdef"
	repo, withSecret := settingsRepo(t, secret)
	ctx := context.Background()
	if got, err := repo.GetMail(ctx); err != nil || got != nil {
		t.Fatalf("before write: %+v, %v; expected nil", got, err)
	}

	saved := &entity.MailSettings{Host: "smtp.example.com", Port: 587, Encryption: entity.MailEncryptionSTARTTLS,
		Sender: "TaskTrail <noreply@example.com>", Username: ptr("robot"), Password: ptr("smtp-password")}
	if err := repo.SaveMail(ctx, saved); err != nil {
		t.Fatal(err)
	}
	got, err := repo.GetMail(ctx)
	if err != nil || got == nil || got.Host != saved.Host || got.Port != saved.Port || got.Encryption != saved.Encryption ||
		got.Sender != saved.Sender || *got.Username != "robot" || got.Password == nil || *got.Password != "smtp-password" {
		t.Fatalf("read %+v, %v", got, err)
	}

	// With another APP_SECRET the password does not decrypt and is treated as not set (ADR-0015)
	if other, err := withSecret("another-secret-another-secret-123").GetMail(ctx); err != nil || other == nil || other.Password != nil {
		t.Fatalf("with a foreign secret: %+v, %v; expected settings without a password", other, err)
	}

	// Without SMTP sign-in
	if err := repo.SaveMail(ctx, &entity.MailSettings{Host: "mailpit", Port: 1025, Encryption: entity.MailEncryptionNone, Sender: "a@b.c"}); err != nil {
		t.Fatal(err)
	}
	if got, err := repo.GetMail(ctx); err != nil || got.Username != nil || got.Password != nil {
		t.Fatalf("without sign-in: %+v, %v", got, err)
	}

	if err := repo.DeleteMail(ctx); err != nil {
		t.Fatal(err)
	}
	if got, err := repo.GetMail(ctx); err != nil || got != nil {
		t.Fatalf("after delete: %+v, %v; expected nil", got, err)
	}
}
