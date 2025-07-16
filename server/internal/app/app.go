package app

import (
	"os"
	"task-trail/config"
	"task-trail/internal/controller/http"
	"task-trail/internal/controller/http/middleware"
	"task-trail/internal/customerrors"
	"task-trail/internal/pkg/contextmanager"
	slogger "task-trail/internal/pkg/logger/slog"
	"task-trail/internal/pkg/password/bcrypt"
	"task-trail/internal/pkg/postgres"
	"task-trail/internal/pkg/smtp/gomail"
	"task-trail/internal/pkg/storage/s3"
	"task-trail/internal/pkg/token/jwt"
	"task-trail/internal/pkg/uuid/guuid"
	"task-trail/internal/repo/api"
	"task-trail/internal/repo/persistent"
	"task-trail/internal/tasks"
	authuc "task-trail/internal/usecase/auth"
	fileuc "task-trail/internal/usecase/file"
	projectuc "task-trail/internal/usecase/project"
	useruc "task-trail/internal/usecase/user"

	"github.com/gin-gonic/gin"
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
	pwdService := bcrypt.New()
	uuidGenerator := guuid.New()
	tokenService := jwt.New(
		cfg.Auth.ATSecret,
		cfg.Auth.ATLifeMin,
		cfg.Auth.RTSecret,
		cfg.Auth.RTLifeMin,
		cfg.Auth.TokenIssuer,
		uuidGenerator)
	errHandler := customerrors.NewErrHander()
	contextm := contextmanager.NewGin(uuidGenerator)
	smtp := gomail.New(logger, cfg.SMTP.Host, cfg.SMTP.Port, cfg.SMTP.User, cfg.SMTP.Password, cfg.SMTP.Sender)
	// TODO: storage selector! if s3 diabled then use local storage
	storage, err := s3.New(cfg.S3.AccessKey, cfg.S3.SecretKey, cfg.S3.UploadURL, cfg.S3.PublicURL, cfg.S3.Bucket)
	if err != nil {
		logger.Error("s3 storage initialization error", "error", err.Error())
		os.Exit(1)
	}
	txManager := persistent.NewPgTxManager(pg.Pool)
	userRepo := persistent.NewUserRepo(pg.Pool)
	projectRepo := persistent.NewProjectRepo(pg.Pool)
	tokenRepo := persistent.NewRefreshTokenRepo(pg.Pool)
	notificationRepo := api.NewSmtpNotificationRepo(smtp, logger, uuidGenerator, cfg.Frontend.VerifyURL, cfg.Frontend.ResetPasswordURL, cfg.Frontend.ProjectURL)
	emailTokenRepo := persistent.NewEmailTokenRepo(pg.Pool)
	fileRepo := persistent.NewFileRepo(pg.Pool)
	// init uc
	fileUC := fileuc.New(txManager, fileRepo, storage, errHandler, uuidGenerator)

	userUC := useruc.New(
		txManager,
		userRepo,
		fileUC,
		storage,
		pwdService,
		errHandler,
		uuidGenerator,
	)
	authUC := authuc.New(
		errHandler,
		txManager,
		userRepo,
		tokenRepo,
		emailTokenRepo,
		notificationRepo,
		pwdService,
		tokenService,
		uuidGenerator,
	)

	projectUC := projectuc.New(txManager, authUC, projectRepo, userRepo, notificationRepo, errHandler)
	// init middlewares

	recoveryMW := middleware.NewRecovery(logger1, contextm)
	requestMW := middleware.NewRequest(contextm)
	logMW := middleware.NewLog(logger1, contextm)
	authMW := middleware.NewAuth(tokenService, errHandler, contextm, cfg.Auth.ATName)
	errorMW := middleware.NewError(logger1, contextm)
	// init http server
	httpServer := gin.New()
	httpServer.Use(requestMW)
	httpServer.Use(logMW)
	httpServer.Use(recoveryMW)
	httpServer.Use(errorMW)
	http.NewRouter(httpServer, errHandler, contextm, userUC, projectUC, authUC, storage, authMW, cfg)
	tasks.CleanupRefreshTokens(tokenRepo, logger)
	tasks.CleanupEmailTokens(emailTokenRepo, logger)
	if err := httpServer.Run(); err != nil {
		logger.Error("http server start failed", "error", err.Error())
		os.Exit(1)
	}

}
