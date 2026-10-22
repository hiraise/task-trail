// Package secretbox encrypts integration secrets for storage in the database (ADR-0015): AES-256-GCM
// with the key keys.Derive(APP_SECRET, keys.SecretBox) and a random nonce at the start of the ciphertext.
package secretbox

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
)

type Box struct {
	aead cipher.AEAD
}

// New takes a 32-byte key.
func New(key []byte) (*Box, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &Box{aead: aead}, nil
}

// Seal encrypts plaintext. label is what the secret belongs to (the setting key): a ciphertext
// moved to another setting will not decrypt.
func (b *Box) Seal(plaintext []byte, label string) ([]byte, error) {
	nonce := make([]byte, b.aead.NonceSize(), b.aead.NonceSize()+len(plaintext)+b.aead.Overhead())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return b.aead.Seal(nonce, nonce, plaintext, []byte(label)), nil
}

// Open decrypts the result of Seal. An error means another APP_SECRET, another setting or
// corrupted data: the secret is then treated as not set (ADR-0015).
func (b *Box) Open(sealed []byte, label string) ([]byte, error) {
	size := b.aead.NonceSize()
	if len(sealed) < size {
		return nil, errors.New("secretbox: ciphertext is shorter than the nonce")
	}
	return b.aead.Open(nil, sealed[:size], sealed[size:], []byte(label))
}
