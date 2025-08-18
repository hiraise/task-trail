package v1

import (
	"net/http"
	"task-trail/internal/controller/http/v1/request"
	"task-trail/internal/controller/http/v1/response"
	"task-trail/internal/customerrors"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/usecase"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

type taskRoutes struct {
	contextmanager contextmanager.Gin
	errHandler     customerrors.ErrorHandler
	u              usecase.Task
}

// @Summary 	create new task
// @Security BearerAuth
// @Tags 		/v1/tasks
// @Accept 		json
// @Produce 	json
// @Param 		body body request.taskCreateReq true "task data"
// @Success 	200 {object} response.taskCreateRes
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		404 {object} response.ErrAPI "user not found"
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Router 		/v1/tasks [post]
func (r *taskRoutes) create(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	data, err := request.BindTaskCreateDTO(c, userID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	id, err := r.u.Create(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.TaskCreateResFromDTO(id))
}

func NewTaskRouter(
	router *gin.RouterGroup,
	u usecase.Task,
	authMW gin.HandlerFunc,
	errHandler customerrors.ErrorHandler,
	contextmanager contextmanager.Gin,
) {
	r := &taskRoutes{u: u, contextmanager: contextmanager, errHandler: errHandler}
	g := router.Group("/tasks")
	g.POST("", authMW, r.create)
}
