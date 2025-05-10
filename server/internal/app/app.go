package app

import (
	"log/slog"
	"os"
	"task-trail/config"
	"task-trail/internal/controller/http"
	"task-trail/internal/controller/http/middleware"
	"task-trail/internal/pkg/password"
	"task-trail/internal/pkg/token"
	"task-trail/internal/pkg/uuid"
	"task-trail/internal/repo"
	"task-trail/internal/usecase"

	"task-trail/pkg/logger"
	slogger "task-trail/pkg/logger/slog"
	"task-trail/pkg/postgres"

	"github.com/gin-gonic/gin"
)

func Run(cfg *config.Config) {
	logger := slogger.New(cfg.App.Debug)
	// init db
	opts := []postgres.Option{postgres.MaxPoolSize(cfg.PG.MaxPoolSize)}
	pg, err := postgres.New(cfg.PG.ConnString, logger, opts...)
	if err != nil {
		logger.Error("postgres connection error", "raw_error", err.Error())
		os.Exit(1)
	}
	defer pg.Close()

	// init repo
	txManager := repo.NewPgTxManager(pg.Pool)
	userRepo := repo.NewUserRepo(pg.Pool)
	tokenRepo := repo.NewTokenRepo(pg.Pool)

	// init services
	pwdService := password.NewBcryptService()
	uuidGenerator := &uuid.UUIDGenerator{}
	tokenService := token.NewJwtService(
		cfg.AUTH.AccessTokenSecret,
		cfg.AUTH.AccessTokenLifetimeMin,
		cfg.AUTH.RefreshTokenSecret,
		cfg.AUTH.RefreshTokenLifetimeMin,
		cfg.AUTH.TokenIssuer,
		uuidGenerator)

	// init uc
	userUC := usecase.NewUserUC(txManager, userRepo, pwdService)
	authUC := usecase.NewAuthUC(logger, txManager, userRepo, tokenRepo, pwdService, tokenService)
	// init http server
	httpServer := gin.New()
	httpServer.Use(CustomLogger(logger))
	httpServer.Use(RecoveryWithLogger(logger))
	httpServer.Use(middleware.ErrorHandler())
	http.NewRouter(httpServer, logger, userUC, authUC)
	httpServer.Run()
}

// TODO: replace and user id
func CustomLogger(l logger.Logger) gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		l.Info("http request",
			slog.Int("status", param.StatusCode),
			slog.String("client_ip", param.ClientIP),
			slog.String("method", param.Method),
			slog.String("path", param.Path),
			slog.String("user_agent", param.Request.UserAgent()),
			slog.String("latency", param.Latency.String()),
		)
		return ""
	})
}

func RecoveryWithLogger(l logger.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				l.Error("panic recovered",
					slog.Any("error", r),
					slog.String("path", c.Request.URL.Path),
					slog.String("method", c.Request.Method),
					slog.String("client_ip", c.ClientIP()),
				)
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}
