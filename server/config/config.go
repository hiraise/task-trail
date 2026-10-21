// Package config читает переменные окружения сервера (ADR-0015): обязательны только
// PG_CONNECTION_STRING и APP_SECRET, у остальных есть значения по умолчанию. То, что
// администратор захочет поменять, — настройки в интерфейсе, а не переменные окружения.
package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

// MinSecretLength — минимальная длина APP_SECRET: из него выводятся ключи подписи токенов
// и шифрования секретов, короткий секрет подбирается по одному перехваченному токену.
const MinSecretLength = 32

type App struct {
	Secret   string `env:"APP_SECRET,required,notEmpty"`
	Port     string `env:"PORT" envDefault:"8080"`
	RootPath string `env:"APP_ROOT_PATH"`
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
		return nil, fmt.Errorf("APP_SECRET короче %d символов: задай случайную строку, например openssl rand -hex 32", MinSecretLength)
	}
	return cfg, nil
}

// findProjectRoot ищет .env вверх от рабочей папки: удобно для запуска из любой папки репозитория.
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
