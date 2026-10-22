package entity

import "crypto/sha256"

// LinkTokenHash — SHA-256 of the token from an invitation or password reset link. Only the person
// gets the token itself, the database keeps the hash (ADR-0016): a database copy cannot restore the link.
type LinkTokenHash []byte

func HashLinkToken(token string) LinkTokenHash {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}
