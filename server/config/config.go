package config

import (
	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

type App struct {
	Debug bool `env:"APP_DEBUG,required"`
}

type Config struct {
	App App
}

func New() (*Config, error) {
	_ = godotenv.Load("../../.env") // If file not found try load anyway
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
