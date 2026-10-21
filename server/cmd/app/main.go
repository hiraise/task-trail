package main

import (
	"fmt"
	"os"

	"task-trail/config"
	"task-trail/internal/app"
)

func main() {
	if len(os.Args) > 1 && (os.Args[1] == "-h" || os.Args[1] == "--help" || os.Args[1] == "help") {
		fmt.Print(app.Usage)
		return
	}
	cfg, err := config.New()
	if err != nil {
		_, _ = fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if len(os.Args) > 1 {
		os.Exit(app.Command(cfg, os.Args[1:], os.Stdout, os.Stderr))
	}
	app.Run(cfg)
}
