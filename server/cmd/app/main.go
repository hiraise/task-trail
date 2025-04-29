package main

import (
	"task-trail/config"
	logger "task-trail/internal"
)

func main() {

	config, err := config.New()
	if err != nil {
		panic(err)
	}
	logger := logger.New(config.App.Debug)

	logger.Info("App started")

}
