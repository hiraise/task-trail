package v1

import (
	"net/http"
	"strconv"
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
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Failure		404 {object} response.ErrAPI "user not found"
// @Router 		/v1/tasks [post]
func (r *taskRoutes) create(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	data, err := request.BindTaskCreateDTO(c, userID)
	if err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	id, err := r.u.Create(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.TaskCreateResFromDTO(id))
}

// @Summary 	get task by id
// @Security BearerAuth
// @Tags 		/v1/tasks
// @Accept 		json
// @Produce 	json
// @Param 		id path int true "task id"
// @Success 	200 {object} response.taskListRes
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Failure		403 {object} response.ErrAPI "access denied"
// @Failure		404 {object} response.ErrAPI "task not found"
// @Router 		/v1/tasks/{id} [get]
func (r *taskRoutes) getByID(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	taskID := utils.Must(strconv.Atoi(c.Param("id")))
	res, err := r.u.GetByID(c, userID, taskID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.TaskListResFromDTO(res))
}

// @Summary 	edit task by id
// @Security BearerAuth
// @Tags 		/v1/tasks
// @Accept 		json
// @Produce 	json
// @Param 		id path int true "task id"
// @Param 		body body request.taskEditReq true "task data"
// @Success 	200 {object} response.taskCreateRes
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Failure		404 {object} response.ErrAPI "user or task not found"
// @Router 		/v1/tasks/{id} [patch]
func (r *taskRoutes) editById(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	taskID := utils.Must(strconv.Atoi(c.Param("id")))
	data, err := request.BindTaskEditDTO(c)
	if err != nil {
		_ = c.Error(r.errHandler.Validation(err))
		return
	}
	if err := r.u.Edit(c, userID, taskID, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
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
	g.PATCH(":id", authMW, r.editById)
	g.GET(":id", authMW, r.getByID)
	g.POST("", authMW, r.create)
}
