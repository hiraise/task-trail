// Package linktoken issues tokens for invitation and password reset links (ADR-0016).
package linktoken

import "crypto/rand"

type Generator struct{}

func New() *Generator {
	return &Generator{}
}

// Generate returns 26 base32 characters — 128 random bits: fits in a URL without
// escaping and cannot be guessed.
func (Generator) Generate() string {
	return rand.Text()
}
