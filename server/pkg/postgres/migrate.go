package postgres

import (
	"errors"
	"task-trail/pkg/logger"
	"time"

	"github.com/golang-migrate/migrate/v4"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func Migrate(dbUrl string, l logger.Logger) error {
	var (
		attempts = 5
		timeout  = time.Second
		m        *migrate.Migrate
		err      error
	)
	for attempts > 0 {
		m, err = migrate.New("file://../../migrations", dbUrl+"?sslmode=disable")
		if err != nil {
			l.Info("try connect to postgresql db for migrate", "attempts", attempts)
			time.Sleep(timeout)
			attempts -= 1
			continue
		}
		break
	}
	if err != nil {
		return err
	}

	defer m.Close()
	err = m.Up()
	if err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			l.Info("migration complete without changes")
			return nil
		}
		return err
	}

	l.Info("migration complete")
	return nil
}
