// Package linktoken выдаёт токены для ссылок приглашений и сброса пароля (ADR-0016).
package linktoken

import "crypto/rand"

type Generator struct{}

func New() *Generator {
	return &Generator{}
}

// Generate возвращает 26 символов base32 — 128 случайных бит: годится в адрес без
// экранирования, а подобрать нельзя.
func (Generator) Generate() string {
	return rand.Text()
}
