package http

import (
	"net/http"
	"task-trail/config"
	v1 "task-trail/internal/controller/http/v1"
	"task-trail/internal/usecase"
	"task-trail/pkg/logger"

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

func NewRouter(app *gin.Engine, l logger.Logger, userUC usecase.User, authUC usecase.Authentication, authMW gin.HandlerFunc, cfg *config.Config) {
	v1.NewRouter(app, cfg, userUC, authUC, l, authMW)

	app.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "kek", "status": http.StatusOK})
	})
	docs.SwaggerInfo.BasePath = cfg.App.RootPath
	app.GET("/docs/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))
}
