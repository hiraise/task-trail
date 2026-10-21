// Package secretbox шифрует секреты интеграций для хранения в базе (ADR-0015): AES-256-GCM
// с ключом keys.Derive(APP_SECRET, keys.SecretBox) и случайным nonce в начале шифротекста.
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

// New принимает 32-байтовый ключ.
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

// Seal шифрует plaintext. label — к чему относится секрет (ключ настройки): шифротекст,
// перенесённый в другую настройку, не расшифруется.
func (b *Box) Seal(plaintext []byte, label string) ([]byte, error) {
	nonce := make([]byte, b.aead.NonceSize(), b.aead.NonceSize()+len(plaintext)+b.aead.Overhead())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return b.aead.Seal(nonce, nonce, plaintext, []byte(label)), nil
}

// Open расшифровывает результат Seal. Ошибка — другой APP_SECRET, другая настройка или
// повреждённые данные: секрет тогда считается не заданным (ADR-0015).
func (b *Box) Open(sealed []byte, label string) ([]byte, error) {
	size := b.aead.NonceSize()
	if len(sealed) < size {
		return nil, errors.New("secretbox: шифротекст короче nonce")
	}
	return b.aead.Open(nil, sealed[:size], sealed[size:], []byte(label))
}
