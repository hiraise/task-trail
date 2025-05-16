package v1

import (
	"net/http"

	"task-trail/config"
	"task-trail/customerrors"

	"task-trail/internal/controller/http/v1/request"
	"task-trail/internal/pkg/contextmanager"

	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

const (
	refreshPath = "/v1/auth/refresh"
)

type authRoutes struct {
	contextmanager contextmanager.Gin
	errHandler     customerrors.ErrorHandler
	u              usecase.Authentication
	atName         string
	rtName         string
	rtPath         string
}

func new(
	contextmanager contextmanager.Gin,
	errHandler customerrors.ErrorHandler,
	u usecase.Authentication,
	cfg *config.Config,
) *authRoutes {
	return &authRoutes{
		contextmanager: contextmanager,
		errHandler:     errHandler,
		u:              u,
		atName:         cfg.AUTH.ATName,
		rtName:         cfg.AUTH.RTName,
		rtPath:         cfg.App.RootPath + refreshPath,
	}
}

// @Summary 	register new user
// @Description endpoint for register new user
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.User true "user email and password"
// @Success 	200
// @Failure		400 {object} customerrors.Err "invalid request body"
// @Failure		409 {object} customerrors.Err "user already exists"
// @Failure		500 {object} customerrors.Err "internal error"
// @Router 		/v1/auth/register [post]
func (r *authRoutes) register(c *gin.Context) {
	var body request.User
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		c.Error(r.errHandler.Validation(err))
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
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.User true "user email and password"
// @Success 	200
// @Failure		400 {object} customerrors.Err "invalid request body"
// @Failure		401 {object} customerrors.Err "invalid credentials"
// @Failure		500 {object} customerrors.Err "internal error"
// @Router 		/v1/auth/login [post]
func (r *authRoutes) login(c *gin.Context) {
	var body request.User
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		c.Error(r.errHandler.Validation(err))
		return
	}
	userId, at, rt, err := r.u.Login(c, body.Email, body.Password)
	if err != nil {
		c.Error(err)
		return
	}
	c.Set("userId", userId)
	r.contextmanager.SetTokens(c, at, rt, r.atName, r.rtName, r.rtPath)
	c.JSON(http.StatusOK, nil)

}

// @Summary 	refresh tokens pair
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Success 	200
// @Failure		401 {object} customerrors.Err "refresh token is invalid"
// @Failure		500 {object} customerrors.Err "internal error"
// @Router 		/v1/auth/refresh [post]
func (r *authRoutes) refresh(c *gin.Context) {
	oldRT, err := c.Cookie(r.rtName)
	if err != nil {
		c.Error(r.errHandler.Unauthorized(err, "refresh token not found"))
		return
	}
	at, rt, err := r.u.Refresh(c, oldRT)
	if err != nil {
		r.contextmanager.DeleteTokens(c, r.atName, r.rtName, r.rtPath)
		c.Error(err)
		return
	}
	r.contextmanager.SetTokens(c, at, rt, r.atName, r.rtName, r.rtPath)
	c.JSON(http.StatusOK, nil)

}

// @Summary 	logout user
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Success 	200
// @Failure		401 {object} customerrors.Err "authentication required"
// @Router 		/v1/auth/logout [post]
func (r *authRoutes) logout(c *gin.Context) {
	r.contextmanager.DeleteTokens(c, r.atName, r.rtName, r.rtPath)
	c.JSON(http.StatusOK, nil)
}

func NewAuthRouter(
	contextmanager contextmanager.Gin,
	router *gin.RouterGroup,
	u usecase.Authentication,
	errHandler customerrors.ErrorHandler,
	cfg *config.Config,
	authMW gin.HandlerFunc,
) {
	r := new(contextmanager, errHandler, u, cfg)
	g := router.Group("/auth")
	g.POST("/login", r.login)
	g.POST("/logout", authMW, r.logout)
	g.POST("/register", r.register)
	g.POST("/refresh", r.refresh)
}
