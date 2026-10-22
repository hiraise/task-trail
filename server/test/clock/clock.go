// Package clock is a fixed clock for tests (ADR-0022): time stands still
// until the test moves it forward.
package clock

import (
	"sync"
	"time"
)

type Fixed struct {
	mu  sync.Mutex
	now time.Time
}

// New sets the clock to now.
func New(now time.Time) *Fixed {
	return &Fixed{now: now}
}

func (c *Fixed) Now() time.Time {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.now
}

// Advance moves the clock forward by d.
func (c *Fixed) Advance(d time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.now = c.now.Add(d)
}
