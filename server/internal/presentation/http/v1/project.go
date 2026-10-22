package v1

import (
	"net/http"

	"task-trail/internal/application/service/project"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// projectRoutes are projects and members: /v1/projects/* in the contract.
type projectRoutes struct {
	cm       *contextmanager.GinContextManager
	services *project.ProjectModule
}

func (r *projectRoutes) userID(c *gin.Context) string {
	return utils.Must(r.cm.GetUserID(c))
}

func (r *projectRoutes) list(c *gin.Context) {
	views, err := r.services.List.Execute(c, r.userID(c))
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewProjects(views))
}

func (r *projectRoutes) create(c *gin.Context) {
	data, err := request.BindCreateProject(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	created, err := r.services.Create.Execute(c, r.userID(c), data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusCreated, response.ProjectCreated{
		Project:     response.NewProjectDetails(created.Project),
		Invitations: response.NewInvitationResults(created.Invitations),
	})
}

func (r *projectRoutes) candidates(c *gin.Context) {
	projectID, err := queryID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	users, err := r.services.Candidates.Execute(c, r.userID(c), projectID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewUsers(users))
}

func (r *projectRoutes) get(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	view, err := r.services.Get.Execute(c, r.userID(c), projectID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewProjectDetails(view))
}

func (r *projectRoutes) update(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	changes, err := request.BindUpdateProject(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	view, err := r.services.Update.Execute(c, r.userID(c), projectID, changes)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewProjectDetails(view))
}

func (r *projectRoutes) delete(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.Delete.Execute(c, r.userID(c), projectID); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *projectRoutes) members(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	members, err := r.services.Members.Execute(c, r.userID(c), projectID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewMembers(members))
}

func (r *projectRoutes) addMembers(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	emails, err := request.BindAddMembers(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	results, err := r.services.AddMembers.Execute(c, r.userID(c), projectID, emails)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewInvitationResults(results))
}

func (r *projectRoutes) changeRole(c *gin.Context) {
	projectID, targetID, err := memberPath(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	role, err := request.BindChangeRole(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	member, err := r.services.ChangeRole.Execute(c, r.userID(c), projectID, targetID, role)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewMember(member))
}

func (r *projectRoutes) removeMember(c *gin.Context) {
	projectID, targetID, err := memberPath(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.RemoveMember.Execute(c, r.userID(c), projectID, targetID); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (r *projectRoutes) leave(c *gin.Context) {
	projectID, err := pathID(c, "projectId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.services.Leave.Execute(c, r.userID(c), projectID); err != nil {
		_ = c.Error(err)
		return
	}
	c.Status(http.StatusNoContent)
}

// memberPath is the project and member IDs from the path /projects/{projectId}/members/{userId}.
func memberPath(c *gin.Context) (projectID, userID string, err error) {
	if projectID, err = pathID(c, "projectId"); err != nil {
		return "", "", err
	}
	if userID, err = pathID(c, "userId"); err != nil {
		return "", "", err
	}
	return projectID, userID, nil
}

func NewProjectRouter(
	router *gin.RouterGroup,
	services *project.ProjectModule,
	authMW gin.HandlerFunc,
	cm *contextmanager.GinContextManager,
) {
	r := &projectRoutes{cm: cm, services: services}
	g := router.Group("/projects", authMW)
	g.GET("", r.list)
	g.POST("", r.create)
	g.GET("/candidates", r.candidates)
	g.GET("/:projectId", r.get)
	g.PATCH("/:projectId", r.update)
	g.DELETE("/:projectId", r.delete)
	g.GET("/:projectId/members", r.members)
	g.POST("/:projectId/members", r.addMembers)
	g.PATCH("/:projectId/members/:userId", r.changeRole)
	g.DELETE("/:projectId/members/:userId", r.removeMember)
	g.DELETE("/:projectId/leave", r.leave)
}
