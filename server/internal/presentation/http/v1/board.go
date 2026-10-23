package v1

import (
	"net/http"

	"task-trail/internal/application/service/board"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// boardRoutes are boards: /v1/boards/* in the contract (ADR-0029).
type boardRoutes struct {
	cm       *contextmanager.GinContextManager
	services *board.BoardModule
}

func (r *boardRoutes) userID(c *gin.Context) string {
	return utils.Must(r.cm.GetUserID(c))
}

func (r *boardRoutes) list(c *gin.Context) {
	views, err := r.services.List.Execute(c, r.userID(c))
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewBoards(views))
}

func (r *boardRoutes) create(c *gin.Context) {
	data, err := request.BindCreateBoard(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	view, err := r.services.Create.Execute(c, r.userID(c), data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusCreated, response.NewBoard(view))
}

func (r *boardRoutes) get(c *gin.Context) {
	boardID, err := pathID(c, "boardId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	view, err := r.services.Get.Execute(c, r.userID(c), boardID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewBoard(view))
}

func (r *boardRoutes) update(c *gin.Context) {
	boardID, err := pathID(c, "boardId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	name, err := request.BindUpdateBoard(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	view, err := r.services.Rename.Execute(c, r.userID(c), boardID, name)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewBoard(view))
}

func (r *boardRoutes) delete(c *gin.Context) {
	boardID, err := pathID(c, "boardId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.Delete.Execute(c, r.userID(c), boardID); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *boardRoutes) setProjects(c *gin.Context) {
	boardID, err := pathID(c, "boardId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	projectIDs, err := request.BindSetBoardProjects(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	view, err := r.services.SetProjects.Execute(c, r.userID(c), boardID, projectIDs)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewBoard(view))
}

func (r *boardRoutes) addMembers(c *gin.Context) {
	boardID, err := pathID(c, "boardId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	userIDs, err := request.BindAddBoardMembers(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	view, err := r.services.AddMembers.Execute(c, r.userID(c), boardID, userIDs)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewBoard(view))
}

func (r *boardRoutes) removeMember(c *gin.Context) {
	boardID, err := pathID(c, "boardId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	targetID, err := pathID(c, "userId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.RemoveMember.Execute(c, r.userID(c), boardID, targetID); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *boardRoutes) leave(c *gin.Context) {
	boardID, err := pathID(c, "boardId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.Leave.Execute(c, r.userID(c), boardID); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *boardRoutes) tasks(c *gin.Context) {
	boardID, err := pathID(c, "boardId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	tasks, err := r.services.ListTasks.Execute(c, r.userID(c), boardID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewTasks(tasks))
}

func NewBoardRouter(
	router *gin.RouterGroup,
	services *board.BoardModule,
	authMW gin.HandlerFunc,
	cm *contextmanager.GinContextManager,
) {
	r := &boardRoutes{cm: cm, services: services}
	g := router.Group("/boards", authMW)
	g.GET("", r.list)
	g.POST("", r.create)
	g.GET("/:boardId", r.get)
	g.PATCH("/:boardId", r.update)
	g.DELETE("/:boardId", r.delete)
	g.PUT("/:boardId/projects", r.setProjects)
	g.POST("/:boardId/members", r.addMembers)
	g.DELETE("/:boardId/members/:userId", r.removeMember)
	g.DELETE("/:boardId/leave", r.leave)
	g.GET("/:boardId/tasks", r.tasks)
}
