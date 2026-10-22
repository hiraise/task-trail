package postgres

import (
	"context"
	"database/sql"
	"errors"
	"io/fs"
	"task-trail/internal/pkg/logger"
	"time"

	"github.com/golang-migrate/migrate/v4"
	pgxmigrate "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
)

// Migrate applies migrations from files (SQL files at the root) to the connString database. The address is parsed
// by pgx, like the connection pool: so migrations and the server connect by the same rules.
func Migrate(connString string, files fs.FS, l logger.Logger) error {
	config, err := pgx.ParseConfig(connString)
	if err != nil {
		return err
	}
	db := stdlib.OpenDB(*config)
	defer func() { _ = db.Close() }()
	if err := waitForDB(db, l); err != nil {
		return err
	}

	driver, err := pgxmigrate.WithInstance(db, &pgxmigrate.Config{})
	if err != nil {
		return err
	}
	source, err := iofs.New(files, ".")
	if err != nil {
		return err
	}
	m, err := migrate.NewWithInstance("iofs", source, "pgx5", driver)
	if err != nil {
		return err
	}
	defer func() {
		if serr, derr := m.Close(); serr != nil || derr != nil {
			l.Error("failed to close migration", "sourceError", serr, "databaseError", derr)
		}
	}()

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			l.Info("migration complete without changes")
			return nil
		}
		return err
	}
	l.Info("migration complete")
	return nil
}

// waitForDB waits for the database while it starts: in Docker the server may start before it.
func waitForDB(db *sql.DB, l logger.Logger) error {
	var err error
	for attempt := 1; attempt <= _defConnAttempts; attempt++ {
		if err = db.PingContext(context.Background()); err == nil {
			return nil
		}
		l.Info("try connect to postgresql db for migrate", "attempt", attempt)
		time.Sleep(_defConnTimeout)
	}
	return err
}
