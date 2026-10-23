package app

import (
	"context"
	"crypto/x509"
	"os"
	"task-trail/config"
	"task-trail/internal/application/service/access"
	"task-trail/internal/application/service/admin"
	"task-trail/internal/application/service/board"
	"task-trail/internal/application/service/file"
	"task-trail/internal/application/service/project"
	"task-trail/internal/application/service/task"
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

// Values that are not configurable (ADR-0015): the administrator has no reason to change them,
// and an environment variable for each is an extra setting at installation.
const (
	accessTokenLifetime  = 15 * time.Minute
	refreshTokenLifetime = 30 * 24 * time.Hour
	// A person may not open a reset link from a letter or from the administrator right away
	passwordResetLifetime = 24 * time.Hour
	cleanupInterval       = time.Hour
	accessTokenCookie     = "at"
	refreshTokenCookie    = "rt"
	tokenIssuer           = "tasktrail"
	pgMaxPoolSize         = 10
	passwordHashCost      = 12
	// A file on disk without a database record younger than a day may be an upload still in progress (ADR-0013)
	orphanFileAge = 24 * time.Hour
	// A project invitation is valid for a week (ADR-0016): the letter states the term
	invitationLifetime = 7 * 24 * time.Hour
)

// Server — the HTTP engine with modules. Run starts it, handler tests build it the same way.
type Server struct {
	Engine  *gin.Engine
	Access  *access.AccessModule
	User    *user.UserModule
	File    *file.FileModule
	Project *project.ProjectModule
	Task    *task.TaskModule
	Board   *board.BoardModule
	Admin   *admin.AdminModule
}

type options struct {
	passwordHashCost int
	smtpRootCAs      *x509.CertPool
}

type Option func(*options)

// WithPasswordHashCost sets the bcrypt cost. Tests only: with the production cost
// every sign-in in a test takes a fraction of a second.
func WithPasswordHashCost(cost int) Option {
	return func(o *options) { o.passwordHashCost = cost }
}

// WithSMTPRootCAs sets root certificates for mail TLS instead of the system ones. Tests only:
// their SMTP server is signed with its own certificate (notification.WithRootCAs).
func WithSMTPRootCAs(pool *x509.CertPool) Option {
	return func(o *options) { o.smtpRootCAs = pool }
}

// New builds the server on top of pool. The clock clk is the system one in Run and a fixed one in tests (ADR-0022).
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
	memberRepo := persistent.NewProjectMemberRepo(pool, userFactory)
	projectRepo := persistent.NewProjectRepo(pool)
	taskRepo := persistent.NewTaskRepo(pool)
	eventRepo := persistent.NewTaskEventRepo(pool)
	eventFactory := factory.NewTaskEventFactory(idGen)
	invitationRepo := persistent.NewInvitationRepo(pool)
	settingsRepo := persistent.NewSettingsRepo(pool, box)
	var mailerOpts []notification.Option
	if o.smtpRootCAs != nil {
		mailerOpts = append(mailerOpts, notification.WithRootCAs(o.smtpRootCAs))
	}
	mailer := notification.NewSMTP(clk, mailerOpts...)
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
		SettingsRepo:         settingsRepo,
		PasswordResetFactory: factory.NewPasswordResetFactory(linktoken.New(), clk, passwordResetLifetime),
		PasswordResetRepo:    persistent.NewPasswordResetRepo(pool),
		InvitationRepo:       invitationRepo,
		ProjectMemberRepo:    memberRepo,
		Mailer:               mailer,
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
	projectModule := project.New(project.Deps{
		TxManager:         txManager,
		Clock:             clk,
		ProjectRepo:       projectRepo,
		ProjectFactory:    factory.NewProjectFactory(idGen, clk),
		MemberRepo:        memberRepo,
		UserRepo:          userRepo,
		TaskRepo:          taskRepo,
		EventRepo:         eventRepo,
		EventFactory:      eventFactory,
		InvitationRepo:    invitationRepo,
		InvitationFactory: factory.NewInvitationFactory(idGen, linktoken.New(), clk, invitationLifetime),
		SettingsRepo:      settingsRepo,
		Mailer:            mailer,
	})
	taskModule := task.New(task.Deps{
		TxManager:      txManager,
		Clock:          clk,
		ProjectRepo:    projectRepo,
		MemberRepo:     memberRepo,
		TaskRepo:       taskRepo,
		TaskFactory:    factory.NewTaskFactory(idGen, clk),
		UserRepo:       userRepo,
		CommentRepo:    persistent.NewCommentRepo(pool),
		CommentFactory: factory.NewCommentFactory(idGen, clk),
		EventRepo:      eventRepo,
		EventFactory:   eventFactory,
	})
	boardModule := board.New(board.Deps{
		TxManager:    txManager,
		Clock:        clk,
		BoardRepo:    persistent.NewBoardRepo(pool, userFactory),
		BoardFactory: factory.NewBoardFactory(idGen, clk),
		MemberRepo:   memberRepo,
		UserRepo:     userRepo,
	})
	adminModule := admin.New(admin.Deps{
		TxManager:    txManager,
		Clock:        clk,
		UserRepo:     userRepo,
		SettingsRepo: settingsRepo,
		Mailer:       mailer,
	})

	engine := gin.New()
	middleware.Setup(engine, idGen, contextManager, l)
	http.NewRouter(engine, contextManager,
		middleware.NewAuth(accessTokenService, contextManager),
		middleware.NewAdmin(accessModule.AdminCheck, contextManager),
		v1.Modules{Access: accessModule, User: userModule, File: fileModule, Project: projectModule, Task: taskModule, Board: boardModule, Admin: adminModule})
	return &Server{
		Engine:  engine,
		Access:  accessModule,
		User:    userModule,
		File:    fileModule,
		Project: projectModule,
		Task:    taskModule,
		Board:   boardModule,
		Admin:   adminModule,
	}, nil
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

// cleaner — a periodic cleanup: expired tokens and invitations, unneeded files.
// done — what to log when something is deleted.
type cleaner struct {
	done    string
	service interface {
		Execute(ctx context.Context) (int64, error)
	}
}

// cleanup runs cleanups at server start and then once per interval until ctx is cancelled.
// A failure of one cleanup does not stop the others.
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
