package keys

import (
	"bytes"
	"testing"
)

func TestDerive(t *testing.T) {
	secret := "0123456789abcdef0123456789abcdef"
	access := Derive(secret, AccessToken)
	if len(access) != Size {
		t.Fatalf("key length %d, expected %d", len(access), Size)
	}
	if !bytes.Equal(access, Derive(secret, AccessToken)) {
		t.Error("the same secret and purpose gave different keys")
	}
	if bytes.Equal(access, Derive(secret, RefreshToken)) || bytes.Equal(access, Derive(secret, SecretBox)) {
		t.Error("different purposes share the same key")
	}
	if bytes.Equal(access, Derive(secret+"x", AccessToken)) {
		t.Error("different secrets gave the same key")
	}
}
