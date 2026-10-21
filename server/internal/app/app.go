package app

import (
	"context"
	"os"
	"task-trail/config"
	"task-trail/internal/application/service/access"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/service"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/clock"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/infrastructure/service/keys"
	"task-trail/internal/infrastructure/service/linktoken"
	"task-trail/internal/infrastructure/service/notification"
	"task-trail/internal/infrastructure/service/password"
	"task-trail/internal/infrastructure/service/secretbox"
	"task-trail/internal/infrastructure/service/token"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/logger"
	slogger "task-trail/internal/pkg/logger/slog"
	"task-trail/internal/pkg/postgres"
	"task-trail/internal/presentation/http"
	"task-trail/internal/presentation/http/middleware"
	"task-trail/migrations"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Значения, которые не настраиваются (ADR-0015): администратору менять их незачем,
// а переменная окружения на каждое — лишняя настройка при установке.
const (
	accessTokenLifetime  = 15 * time.Minute
	refreshTokenLifetime = 30 * 24 * time.Hour
	// Ссылку сброса из письма или от администратора человек может открыть не сразу
	passwordResetLifetime = 24 * time.Hour
	cleanupInterval       = time.Hour
	accessTokenCookie     = "at"
	refreshTokenCookie    = "rt"
	tokenIssuer           = "tasktrail"
	pgMaxPoolSize         = 10
	passwordHashCost      = 12
)

// Server — HTTP-движок с модулями. Run запускает его, тесты обработчиков собирают так же.
type Server struct {
	Engine *gin.Engine
	Access *access.AccessModule
}

type options struct {
	passwordHashCost int
}

type Option func(*options)

// WithPasswordHashCost задаёт стоимость bcrypt. Только для тестов: с боевой стоимостью
// каждый вход в тесте занимает доли секунды.
func WithPasswordHashCost(cost int) Option {
	return func(o *options) { o.passwordHashCost = cost }
}

// New собирает сервер на базе pool. Часы clk — системные в Run и фиксированные в тестах (ADR-0022).
func New(pool *pgxpool.Pool, cfg *config.Config, clk service.Clock, l logger.Logger, opts ...Option) (*Server, error) {
	o := options{passwordHashCost: passwordHashCost}
	for _, opt := range opts {
		opt(&o)
	}
	idGen := id.New()
	box, err := secretbox.New(keys.Derive(cfg.App.Secret, keys.SecretBox))
	if err != nil {
		return nil, err
	}
	accessTokenService := token.New(
		keys.Derive(cfg.App.Secret, keys.AccessToken),
		accessTokenLifetime,
		keys.Derive(cfg.App.Secret, keys.RefreshToken),
		tokenIssuer,
		idGen,
		clk,
	)
	contextManager := contextmanager.NewGin(accessTokenCookie, refreshTokenCookie, cfg.App.RootPath, clk)

	userFactory := factory.NewUserFactory(idGen, clk)
	rtFactory := factory.NewRTFactory(idGen, clk, refreshTokenLifetime)
	accessModule := access.New(access.Deps{
		TxManager:            persistent.NewPgTxManager(pool),
		Clock:                clk,
		UserRepo:             persistent.NewUserRepo(pool, userFactory),
		UserFactory:          userFactory,
		PasswordService:      password.New(o.passwordHashCost),
		RefreshTokenFactory:  rtFactory,
		RefreshTokenRepo:     persistent.NewRefreshTokenRepo(pool, rtFactory),
		AccessTokenService:   accessTokenService,
		SettingsRepo:         persistent.NewSettingsRepo(pool, box),
		PasswordResetFactory: factory.NewPasswordResetFactory(linktoken.New(), clk, passwordResetLifetime),
		PasswordResetRepo:    persistent.NewPasswordResetRepo(pool),
		InvitationRepo:       persistent.NewInvitationRepo(pool),
		ProjectMemberRepo:    persistent.NewProjectMemberRepo(pool),
		Mailer:               notification.NewSMTP(clk),
	})

	engine := gin.New()
	middleware.Setup(engine, idGen, contextManager, l)
	http.NewRouter(engine, contextManager,
		middleware.NewAuth(accessTokenService, contextManager),
		middleware.NewAdmin(accessModule.AdminCheck, contextManager),
		accessModule)
	return &Server{Engine: engine, Access: accessModule}, nil
}

func Run(cfg *config.Config) {
	logger := slogger.New(cfg.App.Debug, true)
	logger1 := slogger.New(cfg.App.Debug, false)
	if err := postgres.Migrate(cfg.PG.ConnString, migrations.FS, logger); err != nil {
		logger.Error("db migration error", "error", err.Error())
		os.Exit(1)
	}
	pg, err := postgres.New(cfg.PG.ConnString, logger, postgres.MaxPoolSize(pgMaxPoolSize))
	if err != nil {
		logger.Error("postgres connection error", "error", err.Error())
		os.Exit(1)
	}
	defer pg.Close()

	server, err := New(pg.Pool, cfg, clock.New(), logger1)
	if err != nil {
		logger.Error("server setup failed", "error", err.Error())
		os.Exit(1)
	}
	go cleanupExpired(context.Background(), server.Access.Cleanup, logger, cleanupInterval)
	if err := server.Engine.Run(":" + cfg.App.Port); err != nil {
		logger.Error("http server start failed", "error", err.Error())
		os.Exit(1)
	}
}

// cleanupExpired удаляет истёкшие токены, ссылки и приглашения при запуске и затем раз
// в interval, пока ctx не отменён.
func cleanupExpired(ctx context.Context, cleanup *access.CleanupService, l logger.Logger, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		if deleted, err := cleanup.Execute(ctx); err != nil {
			l.Error("cleanup failed", "error", err.Error())
		} else if deleted > 0 {
			l.Info("expired tokens and invitations deleted", "count", deleted)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}
