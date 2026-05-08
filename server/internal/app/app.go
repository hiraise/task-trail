package app

import (
	"os"
	"task-trail/config"
	"task-trail/internal/application/service/access"
	"task-trail/internal/customerrors"
	"task-trail/internal/domain/factory"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/id"
	notification "task-trail/internal/infrastructure/service/notification/access"
	"task-trail/internal/infrastructure/service/notification/provider/email"
	"task-trail/internal/infrastructure/service/password"
	"task-trail/internal/infrastructure/service/token"
	"task-trail/internal/pkg/contextmanager"
	slogger "task-trail/internal/pkg/logger/slog"
	"task-trail/internal/pkg/postgres"
	"task-trail/internal/presentation/http"
	"task-trail/internal/presentation/http/middleware"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

func Run(cfg *config.Config) {
	logger := slogger.New(cfg.App.Debug, true)
	logger1 := slogger.New(cfg.App.Debug, false)
	// migrate
	if cfg.PG.MigrationEnabled {
		if err := postgres.Migrate(cfg.PG.ConnString, cfg.PG.MigrationPath, logger); err != nil {
			logger.Error("db migration error", "error", err.Error())
			os.Exit(1)
		}
	}
	// init db
	opts := []postgres.Option{postgres.MaxPoolSize(cfg.PG.MaxPoolSize)}
	pg, err := postgres.New(cfg.PG.ConnString, logger, opts...)
	if err != nil {
		logger.Error("postgres connection error", "error", err.Error())
		os.Exit(1)
	}
	defer pg.Close()

	// init services
	pwdService := password.New(12)
	idGen := id.New()
	accessTokenService := token.New(
		cfg.Auth.ATSecret,
		time.Duration(cfg.Auth.ATLifeMin)*time.Minute,
		cfg.Auth.RTSecret,
		cfg.Auth.TokenIssuer,
		idGen,
	)
	errHandler := customerrors.NewErrHander()
	contextManager := contextmanager.NewGin(cfg.Auth.ATName, cfg.Auth.RTName)
	smtp := email.New(logger, cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.User, cfg.SMTP.Password, cfg.SMTP.Sender)
	// TODO: storage selector! if s3 diabled then use local storage
	// storage, err := s3.New(cfg.S3.AccessKey, cfg.S3.SecretKey, cfg.S3.UploadURL, cfg.S3.PublicURL, cfg.S3.Bucket)
	// if err != nil {
	// 	logger.Error("s3 storage initialization error", "error", err.Error())
	// 	os.Exit(1)
	// }
	accessNotifier := notification.NewSmtpAccessNotifier(smtp, idGen, cfg.Frontend.VerifyURL, cfg.Frontend.ResetPasswordURL)

	// FACTORIES
	userFactory := factory.NewUserFactory(idGen)
	rtFactory := factory.NewRTFactory(idGen, time.Duration(cfg.Auth.RTLifeMin)*time.Minute)
	ctFactory := factory.NewCTFactory(idGen, time.Duration(cfg.Auth.CTLifeMin)*time.Minute)
	txManager := persistent.NewPgTxManager(pg.Pool)
	// REPOSITORIES
	userRepo := persistent.NewUserRepo(pg.Pool, userFactory)
	ctRepo := persistent.NewConfirmationTokenRepo(pg.Pool, ctFactory)
	rtRepo := persistent.NewRefreshTokenRepo(pg.Pool, rtFactory)
	accesModule := access.New(txManager, userRepo, userFactory, pwdService, ctFactory, ctRepo, accessNotifier, rtFactory, rtRepo, accessTokenService)

	recoveryMW := middleware.NewRecovery(logger1, contextManager)
	requestMW := middleware.NewRequest(idGen, contextManager)
	logMW := middleware.NewResponseLog(logger1, contextManager)
	authMW := middleware.NewAuth(accessTokenService, contextManager)
	errorMW := middleware.NewError(logger1, contextManager)
	// init http server
	httpServer := gin.New()
	binding.EnableDecoderDisallowUnknownFields = true
	httpServer.Use(requestMW)
	httpServer.Use(logMW)
	httpServer.Use(recoveryMW)
	httpServer.Use(errorMW)
	http.NewRouter(httpServer, cfg, contextManager, errHandler, authMW, accesModule)
	// tasks.CleanupRefreshTokens(tokenRepo, logger)
	// tasks.CleanupEmailTokens(emailTokenRepo, logger)
	if err := httpServer.Run(); err != nil {
		logger.Error("http server start failed", "error", err.Error())
		os.Exit(1)
	}

}
