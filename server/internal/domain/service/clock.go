package service

import "time"

// Clock — источник текущего времени сервера (ADR-0022): в тестах его подменяют
// фиксированными часами из server/test/clock.
type Clock interface {
	Now() time.Time
}
