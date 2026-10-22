// Package keys derives keys from APP_SECRET (ADR-0015). Each purpose has its own key:
// the token signing key cannot reveal the secret encryption key and vice versa.
package keys

import (
	"crypto/hkdf"
	"crypto/sha256"
)

// Key purposes. Change a string and all keys of that purpose change:
// sessions end and stored secrets can no longer be decrypted.
const (
	AccessToken  = "tasktrail/access-token"
	RefreshToken = "tasktrail/refresh-token"
	SecretBox    = "tasktrail/secret-box"
)

// Size is the key length in bytes: 256 bits for HMAC-SHA256 and AES-256.
const Size = 32

// Derive returns the key for the given purpose.
func Derive(secret, purpose string) []byte {
	key, err := hkdf.Key(sha256.New, []byte(secret), nil, purpose, Size)
	if err != nil {
		// hkdf.Key fails only for a length above 255 hashes — impossible for Size
		panic(err)
	}
	return key
}
