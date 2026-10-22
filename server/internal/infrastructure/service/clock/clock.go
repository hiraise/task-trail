package clock

import "time"

// System is the server clock: the only place where the server calls time.Now (ADR-0022).
type System struct{}

func New() System {
	return System{}
}

func (System) Now() time.Time {
	return time.Now()
}
