package clock

import "time"

// System — часы сервера: единственное место, где сервер вызывает time.Now (ADR-0022).
type System struct{}

func New() System {
	return System{}
}

func (System) Now() time.Time {
	return time.Now()
}
