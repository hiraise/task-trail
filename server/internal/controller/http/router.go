package http

import (
	"net/http"
	"task-trail/config"
	"task-trail/internal/customerrors"

	v1 "task-trail/internal/controller/http/v1"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/storage"
	"task-trail/internal/usecase"

	docs "task-trail/docs"

	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           Task Trail API
// @version         1.0

// @contact.name   HiRaise
// @contact.url    https://hiraise.net/
// @contact.email  musaev.ae@hiraise.net

// @license.name  MIT License
// @license.url   https://mit-license.org/
// @securityDefinitions.apikey BearerAuth
// @in cookie
// @name at

func NewRouter(

	app *gin.Engine,
	errHandler customerrors.ErrorHandler,
	contextmanager contextmanager.Gin,
	userUC usecase.User,
	projectUC usecase.Project,
	authUC usecase.Authentication,
	storage storage.Service,
	authMW gin.HandlerFunc,
	cfg *config.Config,
) {
	v1.NewRouter(
		app,
		cfg,
		userUC,
		projectUC,
		authUC,
		contextmanager,
		errHandler,
		storage,
		authMW,
	)

	app.GET("/", func(c *gin.Context) {
		// TODO: add api info
		c.JSON(http.StatusOK, gin.H{"message": "kek", "status": http.StatusOK})
	})
	if cfg.Docs.Enabled {
		authMiddleware := gin.BasicAuth(gin.Accounts{
			cfg.Docs.Login: cfg.Docs.Password, // логин и пароль
		})
		docs.SwaggerInfo.BasePath = cfg.App.RootPath
		app.GET("/docs/*any", authMiddleware, ginSwagger.WrapHandler(swaggerfiles.Handler))
	}
}
