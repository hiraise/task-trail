package config

import (
	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

type AppConfig struct {
	Debug    bool   `env:"APP_DEBUG,required"`
	RootPath string `env:"APP_ROOT_PATH,required"`
}

type PGConfig struct {
	ConnString       string `env:"PG_CONNECTION_STRING,required"`
	MaxPoolSize      int    `env:"PG_MAX_POOL_SIZE,required"`
	MigrationEnabled bool   `env:"PG_MIGRATION_ENABLED" envDefault:"false"`
	MigrationPath    string `env:"PG_MIGRATION_PATH" envDefault:"file://../../migrations"`
}

type AuthConfig struct {
	ATSecret    string `env:"AUTH_ACCESS_TOKEN_SECRET,required"`
	ATLifeMin   int    `env:"AUTH_ACCESS_TOKEN_LIFETIME_MIN,required"`
	ATName      string `env:"AUTH_ACCESS_TOKEN_NAME" envDefault:"at"`
	RTSecret    string `env:"AUTH_REFRESH_TOKEN_SECRET,required"`
	RTLifeMin   int    `env:"AUTH_REFRESH_TOKEN_LIFETIME_MIN,required"`
	RTName      string `env:"AUTH_REFRESH_TOKEN_NAME" envDefault:"rt"`
	TokenIssuer string `env:"AUTH_TOKEN_ISSUER,required"`
}
type Config struct {
	App  AppConfig
	PG   PGConfig
	AUTH AuthConfig
}

func New() (*Config, error) {
	_ = godotenv.Load("../../.env") // If file not found try load anyway
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}
