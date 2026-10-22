package service

import "time"

// Clock — the source of the server's current time (ADR-0022): tests replace it
// with a fixed clock from server/test/clock.
type Clock interface {
	Now() time.Time
}
