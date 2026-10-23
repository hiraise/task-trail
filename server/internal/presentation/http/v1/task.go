package v1

import (
	"net/http"

	"task-trail/internal/application/service/task"
	"task-trail/internal/domain/entity"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// taskRoutes are tasks, their statuses and feeds: /v1/tasks/*, /v1/task-statuses, project tasks
// and the current user's tasks in the contract.
type taskRoutes struct {
	cm       *contextmanager.GinContextManager
	services *task.TaskModule
}

func (r *taskRoutes) userID(c *gin.Context) string {
	return utils.Must(r.cm.GetUserID(c))
}

// The status set is fixed (ADR-0003), so it needs no use case.
func (r *taskRoutes) statuses(c *gin.Context) {
	c.JSON(http.StatusOK, response.NewTaskStatuses(entity.TaskStatuses()))
}

func (r *taskRoutes) listInProject(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	archived, err := queryBool(c, "archived")
	if err != nil {
		_ = c.Error(err)
		return
	}
	tasks, err := r.services.ListInProject.Execute(c, r.userID(c), projectID, archived)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTasks(tasks))
}

func (r *taskRoutes) listAssigned(c *gin.Context) {
	archived, err := queryBool(c, "archived")
	if err != nil {
		_ = c.Error(err)
		return
	}
	tasks, err := r.services.ListAssigned.Execute(c, r.userID(c), archived)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTasks(tasks))
}

func (r *taskRoutes) create(c *gin.Context) {
	data, err := request.BindCreateTask(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	t, err := r.services.Create.Execute(c, r.userID(c), data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusCreated, response.NewTask(t))
}

func (r *taskRoutes) get(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	t, err := r.services.Get.Execute(c, r.userID(c), taskID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTask(t))
}

func (r *taskRoutes) update(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	changes, err := request.BindUpdateTask(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	t, err := r.services.Update.Execute(c, r.userID(c), taskID, changes)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTask(t))
}

func (r *taskRoutes) changeStatus(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	status, err := request.BindChangeTaskStatus(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	t, err := r.services.ChangeStatus.Execute(c, r.userID(c), taskID, status)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTask(t))
}

func (r *taskRoutes) changeAssignee(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	assigneeID, err := request.BindChangeTaskAssignee(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	t, err := r.services.ChangeAssignee.Execute(c, r.userID(c), taskID, assigneeID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTask(t))
}

func (r *taskRoutes) move(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	projectID, err := request.BindMoveTask(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	t, err := r.services.Move.Execute(c, r.userID(c), taskID, projectID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTask(t))
}

func (r *taskRoutes) setArchived(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	archived, err := request.BindSetArchived(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	t, err := r.services.SetArchived.Execute(c, r.userID(c), taskID, archived)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTask(t))
}

func (r *taskRoutes) delete(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.Delete.Execute(c, r.userID(c), taskID); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *taskRoutes) listComments(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	comments, err := r.services.ListComments.Execute(c, r.userID(c), taskID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTaskComments(comments))
}

func (r *taskRoutes) createComment(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	text, err := request.BindComment(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	comment, err := r.services.CreateComment.Execute(c, r.userID(c), taskID, text)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusCreated, response.NewTaskComment(*comment))
}

func (r *taskRoutes) updateComment(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	commentID, err := pathID(c, "commentId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	text, err := request.BindComment(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	comment, err := r.services.EditComment.Execute(c, r.userID(c), taskID, commentID, text)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTaskComment(*comment))
}

func (r *taskRoutes) deleteComment(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	commentID, err := pathID(c, "commentId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.DeleteComment.Execute(c, r.userID(c), taskID, commentID); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *taskRoutes) listEvents(c *gin.Context) {
	taskID, err := pathID(c, "taskId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	events, err := r.services.ListEvents.Execute(c, r.userID(c), taskID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTaskEvents(events))
}

func NewTaskRouter(
	router *gin.RouterGroup,
	services *task.TaskModule,
	authMW gin.HandlerFunc,
	cm *contextmanager.GinContextManager,
) {
	r := &taskRoutes{cm: cm, services: services}
	g := router.Group("", authMW)
	g.GET("/task-statuses", r.statuses)
	g.GET("/projects/:projectId/tasks", r.listInProject)
	g.GET("/users/me/tasks", r.listAssigned)
	g.POST("/tasks", r.create)
	g.GET("/tasks/:taskId", r.get)
	g.PATCH("/tasks/:taskId", r.update)
	g.DELETE("/tasks/:taskId", r.delete)
	g.PATCH("/tasks/:taskId/status", r.changeStatus)
	g.PATCH("/tasks/:taskId/assignee", r.changeAssignee)
	g.PATCH("/tasks/:taskId/project", r.move)
	g.PATCH("/tasks/:taskId/archived", r.setArchived)
	g.GET("/tasks/:taskId/comments", r.listComments)
	g.POST("/tasks/:taskId/comments", r.createComment)
	g.PATCH("/tasks/:taskId/comments/:commentId", r.updateComment)
	g.DELETE("/tasks/:taskId/comments/:commentId", r.deleteComment)
	g.GET("/tasks/:taskId/events", r.listEvents)
}
