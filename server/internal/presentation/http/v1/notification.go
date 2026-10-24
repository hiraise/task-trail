package v1

import (
	"net/http"

	"task-trail/internal/application/service/notification"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// notificationRoutes — the user's own notifications: /v1/notifications/* in the contract (ADR-0038).
type notificationRoutes struct {
	cm       *contextmanager.GinContextManager
	services *notification.NotificationModule
}

func (r *notificationRoutes) list(c *gin.Context) {
	list, err := r.services.List.Execute(c, utils.Must(r.cm.GetUserID(c)))
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewNotifications(list))
}

func (r *notificationRoutes) unreadCount(c *gin.Context) {
	count, err := r.services.UnreadCount.Execute(c, utils.Must(r.cm.GetUserID(c)))
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.UnreadNotifications{Count: count})
}

func (r *notificationRoutes) setRead(c *gin.Context) {
	id, err := pathID(c, "notificationId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	read, err := request.BindSetRead(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	n, err := r.services.SetRead.Execute(c, utils.Must(r.cm.GetUserID(c)), id, read)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewNotification(*n))
}

func (r *notificationRoutes) readAll(c *gin.Context) {
	if err := r.services.ReadAll.Execute(c, utils.Must(r.cm.GetUserID(c))); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func NewNotificationRouter(
	router *gin.RouterGroup,
	services *notification.NotificationModule,
	authMW gin.HandlerFunc,
	cm *contextmanager.GinContextManager,
) {
	r := &notificationRoutes{cm: cm, services: services}
	g := router.Group("/notifications", authMW)
	g.GET("", r.list)
	// Static segments are matched before :notificationId
	g.GET("/unread-count", r.unreadCount)
	g.POST("/read-all", r.readAll)
	g.PATCH("/:notificationId", r.setRead)
}
