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
	ProjectURL       string `env:"FRONTEND_PROJECT_URL,required"`
}

type S3 struct {
	Enabled   bool   `env:"S3_ENABLED" envDefault:"true"`
	AccessKey string `env:"S3_ACCESS_KEY"`
	SecretKey string `env:"S3_SECRET_KEY"`
	UploadURL string `env:"S3_UPLOAD_URL"`
	PublicURL string `env:"S3_PUBLIC_URL"`
	Bucket    string `env:"S3_BUCKET"`
}
type Config struct {
	App      AppConfig
	PG       PGConfig
	Auth     AuthConfig
	Docs     Docs
	SMTP     SMTP
	Frontend Frontend
	S3       S3
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

	if cfg.S3.Enabled {
		if cfg.S3.AccessKey == "" ||
			cfg.S3.SecretKey == "" ||
			cfg.S3.UploadURL == "" ||
			cfg.S3.PublicURL == "" ||
			cfg.S3.Bucket == "" {
			return nil, fmt.Errorf("all S3 fields (S3_ACCESS_KEY, S3_SECRET_KEY, S3_UPLOAD_URL, S3_PUBLIC_URL, S3_BUCKET) must be set when S3 is enabled")
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
