// Package projectkey gives tests unique project keys: the key is required and unique among
// non-deleted projects (ADR-0026).
package projectkey

import (
	"crypto/rand"
	"strings"
)

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// New returns a random key: S and six upper-case base36 characters, like S0K3ZQ1.
func New() string {
	var b strings.Builder
	b.WriteByte('S')
	random := make([]byte, 6)
	if _, err := rand.Read(random); err != nil {
		panic(err)
	}
	for _, r := range random {
		b.WriteByte(alphabet[int(r)%len(alphabet)])
	}
	return b.String()
}
