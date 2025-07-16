package v1

import (
	"net/http"

	"task-trail/config"
	"task-trail/internal/customerrors"
	"task-trail/internal/utils"

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
// @Param 		body body request.credentials true "user email and password"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		409 {object} response.ErrAPI "user already exists"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/auth/register [post]
func (r *authRoutes) register(c *gin.Context) {
	data, err := request.BindCredentialsDTO(c)
	if err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.Register(c, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	login user
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.credentials true "user email and password"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		401 {object} response.ErrAPI "invalid credentials"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/auth/login [post]
func (r *authRoutes) login(c *gin.Context) {
	data, err := request.BindCredentialsDTO(c)
	if err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	res, err := r.u.Login(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	r.contextmanager.SetUserID(c, res.UserID)
	r.contextmanager.SetTokens(c, res.AT, res.RT, r.atName, r.rtName, r.rtPath)
	c.JSON(http.StatusOK, nil)

}

// @Summary 	refresh tokens pair
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Success 	200
// @Failure		401 {object} response.ErrAPI "refresh token is invalid"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/auth/refresh [post]
func (r *authRoutes) refresh(c *gin.Context) {
	oldRT, err := c.Cookie(r.rtName)
	if err != nil {
		_ = c.Error(r.errHandler.Unauthorized(err, "refresh token not found"))

		return
	}
	res, err := r.u.Refresh(c, oldRT)
	if err != nil {
		r.contextmanager.DeleteTokens(c, r.atName, r.rtName, r.rtPath)
		_ = c.Error(err)
		return
	}
	r.contextmanager.SetTokens(c, res.AT, res.RT, r.atName, r.rtName, r.rtPath)
	c.JSON(http.StatusOK, nil)

}

// @Summary 	logout user
// @Security BearerAuth
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Success 	200
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Router 		/v1/auth/logout [post]
func (r *authRoutes) logout(c *gin.Context) {
	r.contextmanager.DeleteTokens(c, r.atName, r.rtName, r.rtPath)
	c.JSON(http.StatusOK, nil)
}

// @Summary 	verify user account
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.verifyReq true "token"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "token is invalid"
// @Failure		404 {object} response.ErrAPI "token or user not found"
// @Router 		/v1/auth/verify [post]
func (r *authRoutes) verify(c *gin.Context) {
	token, err := request.BindVerifyToken(c)
	if err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.Verify(c, token); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	resend account verification email
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.emailReq true "user email"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Router 		/v1/auth/resend-verification [post]
func (r *authRoutes) resend(c *gin.Context) {
	email, err := request.BindEmail(c)
	if err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.ResendVerificationEmail(c, email); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	send reset password email
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.emailReq true "user email"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Router 		/v1/auth/password/forgot [post]
func (r *authRoutes) forgotPWD(c *gin.Context) {
	email, err := request.BindEmail(c)
	if err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.SendPasswordResetEmail(c, email); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	reset user password
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.resetPasswordReq true "token and new password"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Router 		/v1/auth/password/reset [post]
func (r *authRoutes) resetPWD(c *gin.Context) {
	data, err := request.BindResetPasswordDTO(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.u.ResetPassword(c, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	change user password
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.changePasswordReq true "old and new password"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Router 		/v1/auth/password/change [post]
func (r *authRoutes) changePWD(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	data, err := request.BindChangePasswordDTO(c, userID)
	if err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.ChangePassword(c, data); err != nil {
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
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Router 		/v1/auth/check [get]
func (r *authRoutes) check(c *gin.Context) {
	c.JSON(http.StatusOK, nil)
}

func NewAuthRouter(
	router *gin.RouterGroup,
	u usecase.Authentication,
	authMW gin.HandlerFunc,
	errHandler customerrors.ErrorHandler,
	contextmanager contextmanager.Gin,
	cfg *config.Config,
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
	g.POST("/password/change", authMW, r.changePWD)
	g.POST("/verify", r.verify)
	g.GET("/check", authMW, r.check)
}
