package v1

import (
	"net/http"

	"task-trail/config"
	"task-trail/internal/application/service/access"
	"task-trail/internal/customerrors"
	"task-trail/internal/domain"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

const (
	refreshPath = "/v1/access/refresh"
)

type authRoutes struct {
	contextmanager *contextmanager.GinContextManager
	errHandler     customerrors.ErrorHandler
	services       *access.AccessModule
	rtPath         string
}

func new(
	contextmanager *contextmanager.GinContextManager,
	errHandler customerrors.ErrorHandler,
	services *access.AccessModule,
	cfg *config.Config,
) *authRoutes {
	return &authRoutes{
		contextmanager: contextmanager,
		errHandler:     errHandler,
		services:       services,
		rtPath:         cfg.App.RootPath + refreshPath,
	}
}

// @Summary 	register new user
// @Description endpoint for register new user
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Param 		body body request.credentials true "user email and password"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		409 {object} response.ErrAPI "user already exists"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/access/register [post]
func (r *authRoutes) register(c *gin.Context) {
	data, err := request.BindCredentialsDTO(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.Registration.Execute(c, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	login
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Param 		body body request.credentials true "user email and password"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		401 {object} response.ErrAPI "invalid credentials"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/access/login [post]
func (r *authRoutes) login(c *gin.Context) {
	data, err := request.BindCredentialsDTO(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	res, err := r.services.Login.Execute(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	r.contextmanager.SetUserID(c, res.UserID)
	r.contextmanager.SetTokens(c, res.AccessToken, res.RefreshToken, r.rtPath)
	c.JSON(http.StatusOK, nil)

}

// @Summary 	verfiy user
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Param 		body body request.verifyReq true "verification token"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		401 {object} response.ErrAPI "invalid token"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/access/verify [post]
func (r *authRoutes) verify(c *gin.Context) {
	data, err := request.BindVerifyToken(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.Verify.Execute(c, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)

}

// @Summary 	resend verification
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Param 		body body request.emailReq true "email"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		401 {object} response.ErrAPI "invalid email"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/access/verify/resend [post]
func (r *authRoutes) resend(c *gin.Context) {
	data, err := request.BindEmail(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.ResendVerification.Execute(c, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	reset user password
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Param 		body body request.emailReq true "email"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		401 {object} response.ErrAPI "invalid email"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/access/password/reset [post]
func (r *authRoutes) resetPassword(c *gin.Context) {
	data, err := request.BindEmail(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.ResetPassword.Execute(c, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	confirm reset user password
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Param 		body body request.resetPasswordReq true "token and new password"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		401 {object} response.ErrAPI "invalid token"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/access/password/reset/confirm [post]
func (r *authRoutes) confirmResetPassword(c *gin.Context) {
	data, err := request.BindResetPasswordDTO(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.ConfirmResetPassword.Execute(c, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	refresh user session
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Success 	200
// @Failure		401 {object} response.ErrAPI "invalid token"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/access/refresh [post]
func (r *authRoutes) refresh(c *gin.Context) {

	oldRT, err := c.Cookie(r.contextmanager.RTName)
	if err != nil {
		_ = c.Error(domain.ErrRefreshTokenNotFound())
		return
	}
	res, err := r.services.Refresh.Execute(c, oldRT)
	if err != nil {
		r.contextmanager.DeleteTokens(c, r.rtPath)
		_ = c.Error(err)
		return
	}
	r.contextmanager.SetUserID(c, res.UserID)
	r.contextmanager.SetTokens(c, res.AccessToken, res.RefreshToken, r.rtPath)
	c.JSON(http.StatusOK, nil)
}

// @Summary 	check user authentication
// @Security BearerAuth
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Success 	200
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Router 		/v1/access/check [get]
func (r *authRoutes) check(c *gin.Context) {
	c.JSON(http.StatusOK, nil)
}

// @Summary 	change user password
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Param 		body body request.changePasswordReq true "old and new passoword"
// @Success 	200
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		401 {object} response.ErrAPI "invalid token"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/access/password/change [post]
func (r *authRoutes) changePassword(c *gin.Context) {
	data, err := request.BindChangePasswordDTO(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	userID := utils.Must(r.contextmanager.GetUserID(c))

	if err := r.services.ChangePassword.Execute(c, userID, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	logout
// @Tags 		/v1/access
// @Accept 		json
// @Produce 	json
// @Success 	200
// @Failure		401 {object} response.ErrAPI "invalid token"
// @Failure		500 {object} response.ErrAPI "internal error"
// @Router 		/v1/access/logout [post]
func (r *authRoutes) logout(c *gin.Context) {

	oldRT, err := c.Cookie(r.contextmanager.RTName)
	if err != nil {
		_ = c.Error(domain.ErrRefreshTokenNotFound())
		return
	}
	if err := r.services.Logout.Execute(c, oldRT); err != nil {
		r.contextmanager.DeleteTokens(c, r.rtPath)
		_ = c.Error(err)
		return
	} else {
		r.contextmanager.DeleteTokens(c, r.rtPath)
	}
	c.JSON(http.StatusOK, nil)
}

func NewAccessRouter(
	router *gin.RouterGroup,
	services *access.AccessModule,
	authMW gin.HandlerFunc,
	errHandler customerrors.ErrorHandler,
	contextmanager *contextmanager.GinContextManager,
	cfg *config.Config,
) {
	r := new(contextmanager, errHandler, services, cfg)
	g := router.Group("/access")
	g.POST("/register", r.register)
	g.POST("/login", r.login)
	g.POST("/refresh", r.refresh)
	g.POST("/verify", r.verify)
	g.POST("/verify/resend", r.resend)
	g.POST("/password/reset", r.resetPassword)
	g.POST("/password/reset/confirm", r.confirmResetPassword)
	g.POST("/password/change", authMW, r.changePassword)
	g.POST("/logout", authMW, r.logout)
	g.GET("/check", authMW, r.check)
}
