package v1

import (
	"net/http"

	"task-trail/internal/application/service/access"
	"task-trail/internal/application/service/admin"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// adminRoutes — настройки сервиса и пользователи: /v1/admin/* в контракте. Права администратора
// сервиса проверяет middleware.NewAdmin на всей группе (ADR-0014).
type adminRoutes struct {
	cm       *contextmanager.GinContextManager
	services *admin.AdminModule
	access   *access.AccessModule
}

func (r *adminRoutes) settings(c *gin.Context) {
	settings, err := r.services.Settings.Execute(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewServiceSettings(settings))
}

func (r *adminRoutes) updateSettings(c *gin.Context) {
	serviceURL, err := request.BindUpdateServiceSettings(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	settings, err := r.services.UpdateServiceURL.Execute(c, serviceURL)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewServiceSettings(settings))
}

func (r *adminRoutes) saveMail(c *gin.Context) {
	data, err := request.BindMailSettings(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	settings, err := r.services.SaveMail.Execute(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewServiceSettings(settings))
}

func (r *adminRoutes) disableMail(c *gin.Context) {
	if err := r.services.DisableMail.Execute(c); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *adminRoutes) sendTestMail(c *gin.Context) {
	if err := r.services.SendTestMail.Execute(c, utils.Must(r.cm.GetUserID(c))); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *adminRoutes) users(c *gin.Context) {
	users, err := r.services.Users.Execute(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewAdminUsers(users))
}

func (r *adminRoutes) setAdmin(c *gin.Context) {
	userID, err := pathID(c, "userId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	isAdmin, err := request.BindUpdateAdminUser(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	u, err := r.services.SetAdmin.Execute(c, userID, isAdmin)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewAdminUser(u))
}

func (r *adminRoutes) passwordResetLink(c *gin.Context) {
	userID, err := pathID(c, "userId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	link, err := r.access.PasswordResetLink.ForUser(c, userID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusCreated, response.NewPasswordResetLink(link))
}

func NewAdminRouter(
	router *gin.RouterGroup,
	services *admin.AdminModule,
	accessModule *access.AccessModule,
	authMW gin.HandlerFunc,
	adminMW gin.HandlerFunc,
	cm *contextmanager.GinContextManager,
) {
	r := &adminRoutes{cm: cm, services: services, access: accessModule}
	g := router.Group("/admin", authMW, adminMW)
	g.GET("/settings", r.settings)
	g.PATCH("/settings", r.updateSettings)
	g.PUT("/settings/mail", r.saveMail)
	g.DELETE("/settings/mail", r.disableMail)
	g.POST("/settings/mail/test", r.sendTestMail)
	g.GET("/users", r.users)
	g.PATCH("/users/:userId", r.setAdmin)
	g.POST("/users/:userId/password-reset-link", r.passwordResetLink)
}
