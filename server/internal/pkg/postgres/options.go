package postgres

import "time"

type Option func(*Postgres)

func MaxPoolSize(s int) Option {
	return func(p *Postgres) {
		p.maxPoolSize = s
	}
}

func ConnAttempts(a int) Option {
	return func(p *Postgres) {
		p.connAttempts = a
	}
}

func ConnTimeout(t time.Duration) Option {
	return func(p *Postgres) {
		p.connTimeout = t
	}
}
