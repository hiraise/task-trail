package v1

import (
	"net/http"

	"task-trail/internal/application/service/user"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// userRoutes — текущий пользователь и другие пользователи: /v1/users/* в контракте.
type userRoutes struct {
	cm       *contextmanager.GinContextManager
	services *user.UserModule
}

func (r *userRoutes) me(c *gin.Context) {
	u, err := r.services.Current.Execute(c, utils.Must(r.cm.GetUserID(c)))
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewCurrentUser(u))
}

func (r *userRoutes) updateMe(c *gin.Context) {
	username, err := request.BindUpdateCurrentUser(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	u, err := r.services.Rename.Execute(c, utils.Must(r.cm.GetUserID(c)), username)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewCurrentUser(u))
}

func (r *userRoutes) uploadAvatar(c *gin.Context) {
	upload, err := request.BindAvatar(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	u, err := r.services.UploadAvatar.Execute(c, utils.Must(r.cm.GetUserID(c)), upload)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewCurrentUser(u))
}

func (r *userRoutes) get(c *gin.Context) {
	userID, err := pathID(c, "userId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	u, err := r.services.Profile.Execute(c, utils.Must(r.cm.GetUserID(c)), userID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewUser(u))
}

func NewUserRouter(
	router *gin.RouterGroup,
	services *user.UserModule,
	authMW gin.HandlerFunc,
	cm *contextmanager.GinContextManager,
) {
	r := &userRoutes{cm: cm, services: services}
	g := router.Group("/users", authMW)
	g.GET("/me", r.me)
	g.PATCH("/me", r.updateMe)
	g.PATCH("/me/avatar", r.uploadAvatar)
	g.GET("/:userId", r.get)
}
