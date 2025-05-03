package postgres

import (
	"context"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	_defMaxPoolSize  = 1
	_defConnAttempts = 5
	_defConnTimeout  = time.Second
)

type Postgres struct {
	maxPoolSize  int
	connAttempts int
	connTimeout  time.Duration

	Pool *pgxpool.Pool
}

func New(connString string, l *slog.Logger, opts ...Option) (*Postgres, error) {
	pg := &Postgres{
		maxPoolSize:  _defMaxPoolSize,
		connAttempts: _defConnAttempts,
		connTimeout:  _defConnTimeout,
	}

	for _, opt := range opts {
		opt(pg)
	}

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, err
	}
	config.MaxConns = int32(pg.maxPoolSize)

	for pg.connAttempts > 0 {
		pg.Pool, err = pgxpool.NewWithConfig(context.Background(), config)
		if err == nil {
			err = pg.Pool.Ping(context.Background())
			if err == nil {
				break
			}
		}

		l.Info("try connect to postgresql db", "attempts", pg.connAttempts)

		time.Sleep(pg.connTimeout)
		pg.connAttempts--
	}
	if err != nil {
		return nil, err
	}
	return pg, nil
}

func (p *Postgres) Close() {
	if p.Pool != nil {
		p.Pool.Close()
	}
}
