package config

import (
	"fmt"
	"os"
	"path/filepath"

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
	MigrationPath    string `env:"PG_MIGRATION_PATH"`
}

type Docs struct {
	Enabled  bool   `env:"SWAGGER_ENABLED" envDefault:"true"`
	Login    string `env:"SWAGGER_LOGIN" envDefault:"root"`
	Password string `env:"SWAGGER_PASSWORD" envDefault:"root"`
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

type SMTP struct {
	Host     string `env:"SMTP_HOST,required"`
	Port     int    `env:"SMTP_PORT,required"`
	User     string `env:"SMTP_USER,required"`
	Password string `env:"SMTP_PASSWORD,required"`
	Sender   string `env:"SMTP_SENDER"`
}

type Frontend struct {
	URL              string `env:"FRONTEND_URL,required"`
	VerifyURL        string `env:"FRONTEND_VERIFY_URL,required"`
	ResetPasswordURL string `env:"FRONTEND_RESET_PASSWORD_URL,required"`
}
type Config struct {
	App      AppConfig
	PG       PGConfig
	Auth     AuthConfig
	Docs     Docs
	SMTP     SMTP
	Frontend Frontend
}

func New() (*Config, error) {
	path, _ := findProjectRoot()
	if err := godotenv.Load(path + "/.env"); err != nil {
		fmt.Println(".env file not found. Variables will be taken from environment")
	}
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	if cfg.PG.MigrationEnabled {
		if cfg.PG.MigrationPath == "" {
			return nil, fmt.Errorf("PG_MIGRATION_PATH required if PG_MIGRATION_ENABLED")
		}
	}
	return cfg, nil
}

func findProjectRoot() (string, bool) {
	dir, _ := os.Getwd()
	for dir != "/" {
		if _, err := os.Stat(filepath.Join(dir, ".env")); err == nil {
			return dir, true
		}
		dir = filepath.Dir(dir)
	}
	return "", false
}
