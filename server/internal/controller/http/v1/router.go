package v1

import (
	"task-trail/config"
	"task-trail/internal/customerrors"

	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/storage"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

func NewRouter(
	router *gin.Engine,
	cfg *config.Config,
	userUC usecase.User,
	projectUC usecase.Project,
	authUC usecase.Authentication,
	contextmanager contextmanager.Gin,
	errHandler customerrors.ErrorHandler,
	storage storage.Service,
	authMW gin.HandlerFunc,
) {

	g := router.Group("/v1")
	NewUserRouter(g, userUC, authMW, errHandler, contextmanager, storage)
	NewProjectRouter(g, projectUC, authMW, errHandler, contextmanager)
	NewAuthRouter(g, authUC, authMW, errHandler, contextmanager, cfg)
}
