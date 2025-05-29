package v1

import (
	"net/http"

	"task-trail/config"
	"task-trail/internal/customerrors"

	"task-trail/internal/controller/http/v1/request"
	"task-trail/internal/pkg/contextmanager"

	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

const (
	refreshPath = "/v1/auth/refresh"
)

var validate *validator.Validate = validator.New()

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
		atName:         cfg.Auth.ATName,
		rtName:         cfg.Auth.RTName,
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
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	err := r.u.Register(c, body.Email, body.Password)
	if err != nil {
		_ = c.Error(err)
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
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	userID, at, rt, err := r.u.Login(c, body.Email, body.Password)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.Set("userID", userID)
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
		_ = c.Error(r.errHandler.Unauthorized(err, "refresh token not found"))

		return
	}
	at, rt, err := r.u.Refresh(c, oldRT)
	if err != nil {
		r.contextmanager.DeleteTokens(c, r.atName, r.rtName, r.rtPath)
		_ = c.Error(err)
		return
	}
	r.contextmanager.SetTokens(c, at, rt, r.atName, r.rtName, r.rtPath)
	c.JSON(http.StatusOK, nil)

}

// @Summary 	logout user
// @Security BearerAuth
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

// @Summary 	verify user account
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		token path string true "token"
// @Success 	200
// @Failure		400 {object} customerrors.Err "token is invalid"
// @Failure		404 {object} customerrors.Err "token or user not found"
// @Router 		/v1/auth/verify [post]
func (r *authRoutes) verify(c *gin.Context) {
	token := c.Param("token")
	params := request.VerifyRequest{Token: token}
	if err := validate.Struct(params); err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.Verify(c, params.Token); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	resend account verification email
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.EmailRequest true "user email"
// @Success 	200
// @Failure		400 {object} customerrors.Err "invalid request body"
// @Router 		/v1/auth/resend-verification [post]
func (r *authRoutes) resend(c *gin.Context) {
	var body request.EmailRequest
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.ResendVerificationEmail(c, body.Email); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	send reset password email
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.EmailRequest true "user email"
// @Success 	200
// @Failure		400 {object} customerrors.Err "invalid request body"
// @Router 		/v1/auth/password/forgot [post]
func (r *authRoutes) forgotPWD(c *gin.Context) {
	var body request.EmailRequest
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.SendPasswordResetEmail(c, body.Email); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	reset user password
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.ResetPasswordRequest true "user email"
// @Success 	200
// @Failure		400 {object} customerrors.Err "invalid request body"
// @Router 		/v1/auth/password/reset [post]
func (r *authRoutes) resetPWD(c *gin.Context) {
	var body request.ResetPasswordRequest
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.ResetPassword(c, body.Token, body.Password); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	check user authentication
// @Security BearerAuth
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Success 	200
// @Failure		401 {object} customerrors.Err "authentication required"
// @Router 		/v1/auth/check [get]
func (r *authRoutes) check(c *gin.Context) {
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
	g.POST("/resend-verification", r.resend)
	g.POST("/password/forgot", r.forgotPWD)
	g.POST("/password/reset", r.resetPWD)
	g.POST("/verify/:token", r.verify)
	g.GET("/check", authMW, r.check)
}
