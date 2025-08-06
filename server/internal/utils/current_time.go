package utils

import "time"

func GetCurrentTime() *time.Time {
	t := time.Now()
	return &t
}
