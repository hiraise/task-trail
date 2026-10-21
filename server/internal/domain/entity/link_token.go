package entity

import "crypto/sha256"

// LinkTokenHash — SHA-256 токена из ссылки приглашения или сброса пароля. Сам токен получает
// только человек, в базе — хеш (ADR-0016): по копии базы ссылку не восстановить.
type LinkTokenHash []byte

func HashLinkToken(token string) LinkTokenHash {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}
