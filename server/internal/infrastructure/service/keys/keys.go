// Package keys выводит ключи из APP_SECRET (ADR-0015). У каждого назначения свой ключ:
// по ключу подписи токенов нельзя восстановить ключ шифрования секретов и наоборот.
package keys

import (
	"crypto/hkdf"
	"crypto/sha256"
)

// Назначения ключей. Меняешь строку — все ключи этого назначения становятся другими:
// сессии завершатся, сохранённые секреты перестанут расшифровываться.
const (
	AccessToken  = "tasktrail/access-token"
	RefreshToken = "tasktrail/refresh-token"
	SecretBox    = "tasktrail/secret-box"
)

// Size — длина ключа в байтах: 256 бит для HMAC-SHA256 и AES-256.
const Size = 32

// Derive возвращает ключ для назначения purpose.
func Derive(secret, purpose string) []byte {
	key, err := hkdf.Key(sha256.New, []byte(secret), nil, purpose, Size)
	if err != nil {
		// hkdf.Key ошибается только на длине больше 255 хешей — для Size это невозможно
		panic(err)
	}
	return key
}
