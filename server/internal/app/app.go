package app

import (
	"context"
	"os"
	"task-trail/config"
	"task-trail/internal/application/service/access"
	"task-trail/internal/application/service/file"
	"task-trail/internal/application/service/user"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/service"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/clock"
	"task-trail/internal/infrastructure/service/filestorage"
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
	v1 "task-trail/internal/presentation/http/v1"
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
	// Файл на диске без записи в базе младше суток может быть загрузкой, которая ещё идёт (ADR-0013)
	orphanFileAge = 24 * time.Hour
)

// Server — HTTP-движок с модулями. Run запускает его, тесты обработчиков собирают так же.
type Server struct {
	Engine *gin.Engine
	Access *access.AccessModule
	User   *user.UserModule
	File   *file.FileModule
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

	storage := filestorage.NewDisk(cfg.App.FilesDir)
	txManager := persistent.NewPgTxManager(pool)
	userFactory := factory.NewUserFactory(idGen, clk)
	userRepo := persistent.NewUserRepo(pool, userFactory)
	fileRepo := persistent.NewFileRepo(pool)
	rtFactory := factory.NewRTFactory(idGen, clk, refreshTokenLifetime)
	accessModule := access.New(access.Deps{
		TxManager:            txManager,
		Clock:                clk,
		UserRepo:             userRepo,
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
	userModule := user.New(user.Deps{
		TxManager:   txManager,
		Clock:       clk,
		UserRepo:    userRepo,
		FileRepo:    fileRepo,
		FileFactory: factory.NewFileFactory(idGen, clk),
		FileStorage: storage,
	})
	fileModule := file.New(file.Deps{
		Clock:       clk,
		FileRepo:    fileRepo,
		FileStorage: storage,
		OrphanAge:   orphanFileAge,
	})

	engine := gin.New()
	middleware.Setup(engine, idGen, contextManager, l)
	http.NewRouter(engine, contextManager,
		middleware.NewAuth(accessTokenService, contextManager),
		middleware.NewAdmin(accessModule.AdminCheck, contextManager),
		v1.Modules{Access: accessModule, User: userModule, File: fileModule})
	return &Server{Engine: engine, Access: accessModule, User: userModule, File: fileModule}, nil
}

func Run(cfg *config.Config) {
	logger := slogger.New(cfg.App.Debug, true)
	logger1 := slogger.New(cfg.App.Debug, false)
	if err := postgres.Migrate(cfg.PG.ConnString, migrations.FS, logger); err != nil {
		logger.Error("db migration error", "error", err.Error())
		os.Exit(1)
	}
	if err := filestorage.Prepare(cfg.App.FilesDir); err != nil {
		logger.Error("files directory error", "error", err.Error())
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
	go cleanup(context.Background(), logger, cleanupInterval, []cleaner{
		{"expired tokens and invitations deleted", server.Access.Cleanup},
		{"unneeded files erased", server.File.Cleanup},
	})
	if err := server.Engine.Run(":" + cfg.App.Port); err != nil {
		logger.Error("http server start failed", "error", err.Error())
		os.Exit(1)
	}
}

// cleaner — периодическая очистка: истёкшие токены и приглашения, ненужные файлы.
// done — что писать в лог, когда что-то удалено.
type cleaner struct {
	done    string
	service interface {
		Execute(ctx context.Context) (int64, error)
	}
}

// cleanup запускает очистки при запуске сервера и затем раз в interval, пока ctx не отменён.
// Сбой одной очистки не мешает остальным.
func cleanup(ctx context.Context, l logger.Logger, interval time.Duration, cleaners []cleaner) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		for _, c := range cleaners {
			if count, err := c.service.Execute(ctx); err != nil {
				l.Error("cleanup failed", "cleanup", c.done, "error", err.Error())
			} else if count > 0 {
				l.Info(c.done, "count", count)
			}
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}
