package main

import (
	"fmt"
	"task-trail/config"
	"task-trail/internal/app"
)

func main() {
	fmt.Println("start")
	config, err := config.New()
	if err != nil {
		panic(err)
	}
	app.Run(config)
}
