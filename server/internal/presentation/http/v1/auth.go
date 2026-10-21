package v1

import (
	"errors"
	"net/http"

	"task-trail/internal/application/service/access"
	"task-trail/internal/domain"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// authRoutes — вход, сессия, пароль и приглашения: /v1/auth/* в контракте.
type authRoutes struct {
	cm       *contextmanager.GinContextManager
	services *access.AccessModule
}

func (r *authRoutes) register(c *gin.Context) {
	data, err := request.BindRegister(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	session, err := r.services.Registration.Execute(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	r.cm.SetUserID(c, string(session.UserID))
	r.cm.SetTokens(c, session.AccessToken, session.RefreshToken)
	c.JSON(http.StatusCreated, response.NewCurrentUser(session.User))
}

func (r *authRoutes) login(c *gin.Context) {
	data, err := request.BindCredentials(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	session, err := r.services.Login.Execute(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	r.cm.SetUserID(c, string(session.UserID))
	r.cm.SetTokens(c, session.AccessToken, session.RefreshToken)
	c.JSON(http.StatusOK, response.NewCurrentUser(session.User))
}

func (r *authRoutes) refresh(c *gin.Context) {
	rt, err := c.Cookie(r.cm.RTName)
	if err != nil {
		_ = c.Error(domain.ErrRefreshTokenNotFound())
		return
	}
	tokens, err := r.services.Refresh.Execute(c, rt)
	if err != nil {
		// При сбое сервера сессия ещё может пригодиться: cookie удаляются, только если она недействительна
		if sessionInvalid(err) {
			r.cm.DeleteTokens(c)
		}
		_ = c.Error(err)
		return
	}
	r.cm.SetUserID(c, string(tokens.UserID))
	r.cm.SetTokens(c, tokens.AccessToken, tokens.RefreshToken)
	c.Status(http.StatusNoContent)
}

func sessionInvalid(err error) bool {
	var e *domain.DomainError
	if !errors.As(err, &e) {
		return false
	}
	switch e.Code {
	case domain.RefreshTokenNotFound, domain.RefreshTokenWrong, domain.RefreshTokenRevoked,
		domain.RefreshTokenReused, domain.RefreshTokenExpired, domain.ParseTokenFailed:
		return true
	}
	return false
}

// logout удаляет cookie всегда, даже если токен недействителен или его нет.
func (r *authRoutes) logout(c *gin.Context) {
	r.cm.DeleteTokens(c)
	if rt, err := c.Cookie(r.cm.RTName); err == nil {
		if err := r.services.Logout.Execute(c, rt); err != nil {
			_ = c.Error(err)
			return
		}
	}
	c.Status(http.StatusNoContent)
}

func (r *authRoutes) check(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func (r *authRoutes) changePassword(c *gin.Context) {
	data, err := request.BindChangePassword(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	userID := utils.Must(r.cm.GetUserID(c))
	if err := r.services.ChangePassword.Execute(c, userID, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *authRoutes) forgotPassword(c *gin.Context) {
	email, err := request.BindForgotPassword(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.ForgotPassword.Execute(c, email); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *authRoutes) resetPassword(c *gin.Context) {
	data, err := request.BindResetPassword(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.ResetPassword.Execute(c, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *authRoutes) lookupInvitation(c *gin.Context) {
	token, err := request.BindInvitationToken(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	info, err := r.services.InvitationLookup.Execute(c, token)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.InvitationInfo{
		Email:       string(info.Email),
		ProjectName: info.ProjectName,
		InvitedBy:   info.InvitedBy,
	})
}

func (r *authRoutes) acceptInvitation(c *gin.Context) {
	data, err := request.BindAcceptInvitation(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	session, err := r.services.AcceptInvitation.Execute(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	r.cm.SetUserID(c, string(session.UserID))
	r.cm.SetTokens(c, session.AccessToken, session.RefreshToken)
	c.JSON(http.StatusCreated, response.NewCurrentUser(session.User))
}

func (r *authRoutes) publicSettings(c *gin.Context) {
	settings, err := r.services.PublicSettings.Execute(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.PublicSettings{
		RegistrationOpen: settings.RegistrationOpen,
		MailEnabled:      settings.MailEnabled,
	})
}

func NewAuthRouter(
	router *gin.RouterGroup,
	services *access.AccessModule,
	authMW gin.HandlerFunc,
	cm *contextmanager.GinContextManager,
) {
	r := &authRoutes{cm: cm, services: services}
	router.GET("/settings/public", r.publicSettings)
	g := router.Group("/auth")
	g.POST("/register", r.register)
	g.POST("/login", r.login)
	g.POST("/refresh", r.refresh)
	g.POST("/logout", r.logout)
	g.GET("/check", authMW, r.check)
	g.POST("/password/change", authMW, r.changePassword)
	g.POST("/password/forgot", r.forgotPassword)
	g.POST("/password/reset", r.resetPassword)
	g.POST("/invitations/lookup", r.lookupInvitation)
	g.POST("/invitations/accept", r.acceptInvitation)
}
