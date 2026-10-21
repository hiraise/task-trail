// Package clock — фиксированные часы для тестов (ADR-0022): время стоит на месте,
// пока тест не переведёт его вперёд.
package clock

import (
	"sync"
	"time"
)

type Fixed struct {
	mu  sync.Mutex
	now time.Time
}

// New ставит часы на now.
func New(now time.Time) *Fixed {
	return &Fixed{now: now}
}

func (c *Fixed) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.now
}

// Advance переводит часы вперёд на d.
func (c *Fixed) Advance(d time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.now = c.now.Add(d)
}
