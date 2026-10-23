package v1

import (
	"net/http"

	"task-trail/internal/application/service/label"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// labelRoutes are labels of a project: /v1/projects/{projectId}/labels/* in the contract (ADR-0035).
type labelRoutes struct {
	cm       *contextmanager.GinContextManager
	services *label.LabelModule
}

func (r *labelRoutes) userID(c *gin.Context) string {
	return utils.Must(r.cm.GetUserID(c))
}

func (r *labelRoutes) list(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	labels, err := r.services.List.Execute(c, r.userID(c), projectID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewLabels(labels))
}

func (r *labelRoutes) create(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	data, err := request.BindCreateLabel(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	l, err := r.services.Create.Execute(c, r.userID(c), projectID, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusCreated, response.NewLabel(l))
}

func (r *labelRoutes) update(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	labelID, err := pathID(c, "labelId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	changes, err := request.BindUpdateLabel(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	l, err := r.services.Update.Execute(c, r.userID(c), projectID, labelID, changes)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewLabel(l))
}

func (r *labelRoutes) delete(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	labelID, err := pathID(c, "labelId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.Delete.Execute(c, r.userID(c), projectID, labelID); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func NewLabelRouter(
	router *gin.RouterGroup,
	services *label.LabelModule,
	authMW gin.HandlerFunc,
	cm *contextmanager.GinContextManager,
) {
	r := &labelRoutes{cm: cm, services: services}
	g := router.Group("/projects/:projectId/labels", authMW)
	g.GET("", r.list)
	g.POST("", r.create)
	g.PATCH("/:labelId", r.update)
	g.DELETE("/:labelId", r.delete)
}
