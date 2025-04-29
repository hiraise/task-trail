package main

import (
	"fmt"
	"task-trail/config"
)

func main() {

	config, err := config.New()
	if err != nil {
		panic(err)
	}
	fmt.Println(config.App.Debug)

}
