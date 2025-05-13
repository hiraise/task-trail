package config

import (
	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

type App struct {
	Debug bool `env:"APP_DEBUG,required"`
}

type PG struct {
	ConnString  string `env:"PG_CONNECTION_STRING,required"`
	MaxPoolSize int    `env:"PG_MAX_POOL_SIZE,required"`
}

type AUTH struct {
	AccessTokenSecret       string `env:"AUTH_ACCESS_TOKEN_SECRET,required"`
	AccessTokenLifetimeMin  int    `env:"AUTH_ACCESS_TOKEN_LIFETIME_MIN,required"`
	RefreshTokenSecret      string `env:"AUTH_REFRESH_TOKEN_SECRET,required"`
	RefreshTokenLifetimeMin int    `env:"AUTH_REFRESH_TOKEN_LIFETIME_MIN,required"`
	TokenIssuer             string `env:"AUTH_TOKEN_ISSUER,required"`
}
type Config struct {
	App  App
	PG   PG
	AUTH AUTH
}

func New() (*Config, error) {
	_ = godotenv.Load("../../.env") // If file not found try load anyway
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
