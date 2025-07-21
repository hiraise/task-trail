package utils

import "time"

func Must[T any](value T, err error) T {
	if err != nil {
		panic(err)
	}
	return value
}

func GetCurrentTime() *time.Time {
	t := time.Now()
	return &t
}
