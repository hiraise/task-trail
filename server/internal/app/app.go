package app

import (
	"os"
	"task-trail/config"
	"task-trail/internal/application/service/access"
	"task-trail/internal/customerrors"
	"task-trail/internal/domain/factory"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/clock"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/infrastructure/service/keys"
	notification "task-trail/internal/infrastructure/service/notification/access"
	"task-trail/internal/infrastructure/service/notification/provider/email"
	"task-trail/internal/infrastructure/service/password"
	"task-trail/internal/infrastructure/service/token"
	"task-trail/internal/pkg/contextmanager"
	slogger "task-trail/internal/pkg/logger/slog"
	"task-trail/internal/pkg/postgres"
	"task-trail/internal/presentation/http"
	"task-trail/internal/presentation/http/middleware"
	"task-trail/migrations"
	"time"

	"github.com/gin-gonic/gin"
)

// Значения, которые не настраиваются (ADR-0015): администратору менять их незачем,
// а переменная окружения на каждое — лишняя настройка при установке.
const (
	accessTokenLifetime       = 15 * time.Minute
	refreshTokenLifetime      = 30 * 24 * time.Hour
	confirmationTokenLifetime = time.Hour
	accessTokenCookie         = "at"
	refreshTokenCookie        = "rt"
	tokenIssuer               = "tasktrail"
	pgMaxPoolSize             = 10
	passwordHashCost          = 12
)

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

	// init services
	pwdService := password.New(passwordHashCost)
	idGen := id.New()
	systemClock := clock.New()
	accessTokenService := token.New(
		keys.Derive(cfg.App.Secret, keys.AccessToken),
		accessTokenLifetime,
		keys.Derive(cfg.App.Secret, keys.RefreshToken),
		tokenIssuer,
		idGen,
		systemClock,
	)
	errHandler := customerrors.NewErrHander()
	contextManager := contextmanager.NewGin(accessTokenCookie, refreshTokenCookie, systemClock)
	smtp := email.New(logger, cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.User, cfg.SMTP.Password, cfg.SMTP.Sender)
	accessNotifier := notification.NewSmtpAccessNotifier(smtp, idGen, cfg.Frontend.VerifyURL, cfg.Frontend.ResetPasswordURL)

	// FACTORIES
	userFactory := factory.NewUserFactory(idGen)
	rtFactory := factory.NewRTFactory(idGen, refreshTokenLifetime)
	ctFactory := factory.NewCTFactory(idGen, confirmationTokenLifetime)
	txManager := persistent.NewPgTxManager(pg.Pool)
	// REPOSITORIES
	userRepo := persistent.NewUserRepo(pg.Pool, userFactory)
	ctRepo := persistent.NewConfirmationTokenRepo(pg.Pool, ctFactory)
	rtRepo := persistent.NewRefreshTokenRepo(pg.Pool, rtFactory)
	accesModule := access.New(txManager, userRepo, userFactory, pwdService, ctFactory, ctRepo, accessNotifier, rtFactory, rtRepo, accessTokenService)

	httpServer := gin.New()
	middleware.Setup(httpServer, idGen, contextManager, logger1)
	http.NewRouter(httpServer, cfg, contextManager, errHandler, middleware.NewAuth(accessTokenService, contextManager), accesModule)
	// TODO(этап 1): периодически удалять просроченные и отозванные refresh- и confirmation-токены.
	if err := httpServer.Run(":" + cfg.App.Port); err != nil {
		logger.Error("http server start failed", "error", err.Error())
		os.Exit(1)
	}
}
