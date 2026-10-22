// Package config reads the server environment variables (ADR-0015): only
// PG_CONNECTION_STRING and APP_SECRET are required, the rest have defaults. What
// the administrator may want to change is a setting in the UI, not an environment variable.
package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

// MinSecretLength — the minimum APP_SECRET length: token signing and secret encryption keys
// are derived from it, a short secret is brute-forced from one intercepted token.
const MinSecretLength = 32

type App struct {
	Secret   string `env:"APP_SECRET,required,notEmpty"`
	Port     string `env:"PORT" envDefault:"8080"`
	RootPath string `env:"APP_ROOT_PATH"`
	// FilesDir — the files folder (ADR-0013); a relative path is relative to the server working folder.
	FilesDir string `env:"FILES_DIR" envDefault:"files"`
	Debug    bool   `env:"APP_DEBUG" envDefault:"false"`
}

type PG struct {
	ConnString string `env:"PG_CONNECTION_STRING,required,notEmpty"`
}

type Config struct {
	App App
	PG  PG
}

func New() (*Config, error) {
	if path, ok := findProjectRoot(); ok {
		if err := godotenv.Load(filepath.Join(path, ".env")); err != nil {
			return nil, err
		}
	}
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	if len(cfg.App.Secret) < MinSecretLength {
		return nil, fmt.Errorf("APP_SECRET is shorter than %d characters: set a random string, e.g. openssl rand -hex 32", MinSecretLength)
	}
	return cfg, nil
}

// findProjectRoot looks for .env up from the working folder: handy for running from any repository folder.
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
