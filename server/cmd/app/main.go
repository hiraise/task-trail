package main

import (
	"task-trail/config"
	"task-trail/internal/app"
)

func main() {
	config, err := config.New()
	if err != nil {
		panic(err)
	}
	app.Run(config)
}
