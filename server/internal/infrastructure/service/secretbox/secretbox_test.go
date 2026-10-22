package secretbox

import (
	"bytes"
	"testing"

	"task-trail/internal/infrastructure/service/keys"
)

func box(t *testing.T, secret string) *Box {
	t.Helper()
	b, err := New(keys.Derive(secret, keys.SecretBox))
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func TestSealOpen(t *testing.T) {
	b := box(t, "0123456789abcdef0123456789abcdef")
	sealed, err := b.Seal([]byte("smtp-password"), "mail")
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(sealed, []byte("smtp-password")) {
		t.Fatal("the secret is visible in the ciphertext")
	}
	opened, err := b.Open(sealed, "mail")
	if err != nil || string(opened) != "smtp-password" {
		t.Fatalf("decrypted %q, error %v", opened, err)
	}
	again, _ := b.Seal([]byte("smtp-password"), "mail")
	if bytes.Equal(sealed, again) {
		t.Error("identical secrets gave the same ciphertext: the nonce is not random")
	}
}

func TestOpenFails(t *testing.T) {
	b := box(t, "0123456789abcdef0123456789abcdef")
	sealed, _ := b.Seal([]byte("smtp-password"), "mail")
	if _, err := b.Open(sealed, "other"); err == nil {
		t.Error("a secret of one setting decrypted as a secret of another")
	}
	if _, err := box(t, "another-secret-another-secret-123").Open(sealed, "mail"); err == nil {
		t.Error("the secret decrypted with another APP_SECRET")
	}
	if _, err := b.Open([]byte("short"), "mail"); err == nil {
		t.Error("a truncated ciphertext decrypted")
	}
}
