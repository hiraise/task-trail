package v1

import (
	"net/http"

	"task-trail/config"
	customerrors "task-trail/error"
	"task-trail/error/validationerr"

	"task-trail/internal/controller/http/helper"
	"task-trail/internal/controller/http/v1/request"
	"task-trail/internal/usecase"
	"task-trail/pkg/logger"

	"github.com/gin-gonic/gin"
)

const (
	refreshPath = "/v1/auth/refresh"
)

type authRoutes struct {
	u      usecase.Authentication
	l      logger.Logger
	atName string
	rtName string
	rtPath string
}

func new(
	u usecase.Authentication,
	l logger.Logger,
	cfg *config.Config,
) *authRoutes {
	return &authRoutes{
		u:      u,
		l:      l,
		atName: cfg.AUTH.ATName,
		rtName: cfg.AUTH.RTName,
		rtPath: cfg.App.RootPath + refreshPath,
	}
}

// @Summary 	register new user
// @Description endpoint for register new user
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.User true "user email and password"
// @Success 	200
// @Failure		400 {object} customerrors.ErrBase "invalid request body"
// @Failure		409 {object} customerrors.ErrBase "user already exists"
// @Failure		500 {object} customerrors.ErrBase "internal error"
// @Router 		/v1/auth/register [post]
func (r *authRoutes) register(c *gin.Context) {
	var body request.User
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		c.Error(validationerr.New(err))
		return
	}
	err := r.u.Register(c, body.Email, body.Password)
	if err != nil {
		c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	login user
// @Description endpoint for login user
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.User true "user email and password"
// @Success 	200
// @Failure		400 {object} customerrors.ErrBase "invalid request body"
// @Failure		401 {object} customerrors.ErrBase "invalid credentials"
// @Failure		500 {object} customerrors.ErrBase "internal error"
// @Router 		/v1/auth/login [post]
func (r *authRoutes) login(c *gin.Context) {
	var body request.User
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		r.l.Warn("invalid request body", "error", err.Error())
		c.Error(validationerr.New(err))
		return
	}
	at, rt, err := r.u.Login(c, body.Email, body.Password)
	if err != nil {
		c.Error(err)
		return
	}
	helper.SetTokens(c, at, rt, r.atName, r.rtName, r.rtPath)
	c.JSON(http.StatusOK, nil)

}

// @Summary 	refresh tokens
// @Description refresh user tokens pair
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Success 	200
// @Failure		401 {object} customerrors.ErrBase "refresh token is invalid"
// @Failure		500 {object} customerrors.ErrBase "internal error"
// @Router 		/v1/auth/refresh [post]
func (r *authRoutes) refresh(c *gin.Context) {
	oldRT, err := c.Cookie(r.rtName)
	if err != nil {
		r.l.Warn("refresh token not found", "error", err)
		c.Error(customerrors.NewErrUnauthorized(nil))
		return
	}
	at, rt, err := r.u.Refresh(c, oldRT)
	if err != nil {
		helper.DeleteTokens(c, r.atName, r.rtName, r.rtPath)
		c.Error(err)
		return
	}
	helper.SetTokens(c, at, rt, r.atName, r.rtName, r.rtPath)
	c.JSON(http.StatusOK, nil)

}

func NewAuthRouter(router *gin.RouterGroup, u usecase.Authentication, l logger.Logger, cfg *config.Config) {
	r := new(u, l, cfg)
	g := router.Group("/auth")
	g.POST("/login", r.login)
	g.POST("/register", r.register)
	g.POST("/refresh", r.refresh)
}
