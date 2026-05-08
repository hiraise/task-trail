package http

import (
	"net/http"
	"task-trail/config"
	"task-trail/internal/application/service/access"
	"task-trail/internal/customerrors"

	"task-trail/internal/pkg/contextmanager"
	v1 "task-trail/internal/presentation/http/v1"

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
	cfg *config.Config,
	contextmanager *contextmanager.GinContextManager,
	errHandler customerrors.ErrorHandler,
	authMW gin.HandlerFunc,
	accessModule *access.AccessModule,
) {
	v1.NewRouter(
		app,
		cfg,
		contextmanager,
		errHandler,
		authMW,
		accessModule,
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
