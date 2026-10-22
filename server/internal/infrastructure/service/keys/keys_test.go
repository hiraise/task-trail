package keys

import (
	"bytes"
	"testing"
)

func TestDerive(t *testing.T) {
	secret := "0123456789abcdef0123456789abcdef"
	access := Derive(secret, AccessToken)
	if len(access) != Size {
		t.Fatalf("длина ключа %d, ожидалась %d", len(access), Size)
	}
	if !bytes.Equal(access, Derive(secret, AccessToken)) {
		t.Error("один секрет и назначение дали разные ключи")
	}
	if bytes.Equal(access, Derive(secret, RefreshToken)) || bytes.Equal(access, Derive(secret, SecretBox)) {
		t.Error("у разных назначений одинаковый ключ")
	}
	if bytes.Equal(access, Derive(secret+"x", AccessToken)) {
		t.Error("разные секреты дали одинаковый ключ")
	}
}
