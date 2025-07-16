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

type projectRoutes struct {
	contextmanager contextmanager.Gin
	errHandler     customerrors.ErrorHandler
	u              usecase.Project
}

// @Summary 	create new project
// @Security BearerAuth
// @Tags 		/v1/project
// @Accept 		json
// @Produce 	json
// @Param 		body body request.projectCreateReq true "project data"
// @Success 	200 {object} response.projectCreateRes
// @Failure		400 {object} response.ErrAPI "invalid request body"
// @Failure		404 {object} response.ErrAPI "user not found"
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Router 		/v1/projects [post]
func (r *projectRoutes) create(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	data, err := request.BindProjectCreateDTO(c, userID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	id, err := r.u.Create(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewProjectCreateResFromDTO(id))
}

// @Summary 	get list of projects
// @Description List of projects where current user is a member or owner
// @Security BearerAuth
// @Tags 		/v1/project
// @Accept 		json
// @Produce 	json
// @Success 	200 {array} response.projectRes
// @Failure		404 {object} response.ErrAPI "user not found"
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Router 		/v1/projects [get]
func (r *projectRoutes) getProjects(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	data, err := request.BindProjectListDTO(c, userID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	res, err := r.u.GetList(c, data)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewProjectResFromDTOBatch(res))
}

// @Summary 	get project by id
// @Description Project by id, where current user is a member
// @Security BearerAuth
// @Tags 		/v1/project
// @Accept 		json
// @Produce 	json
// @Param 		id path int true "project id"
// @Success 	200 {object} response.projectRes
// @Failure		404 {object} response.ErrAPI "project not found"
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Router 		/v1/projects/{id} [get]
func (r *projectRoutes) getByID(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	projectID := utils.Must(strconv.Atoi(c.Param("id")))
	res, err := r.u.GetByID(c, projectID, userID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewProjectResFromDTO(res))
}

// @Summary 	add new members to project
// @Description validate list of candidates, create accounts if they do not exist yet, and add them to the project
// @Security BearerAuth
// @Tags 		/v1/project
// @Accept 		json
// @Produce 	json
// @Param 		id path int true "project id"
// @Param 		body body request.projectAddMembersReq true "emails"
// @Success 	200
// @Failure		404 {object} response.ErrAPI "user not found"
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Router 		/v1/projects/{id}/members [post]
func (r *projectRoutes) addMembers(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	projectID := utils.Must(strconv.Atoi(c.Param("id")))
	data, err := request.BindProjectAddMembersDTO(c, userID, projectID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	if err := r.u.AddMembers(c, data); err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

// @Summary 	get list of candidates to add to the project
// @Description Candidates are participatns in other projects owned by the current user
// @Security BearerAuth
// @Tags 		/v1/project
// @Accept 		json
// @Produce 	json
// @Param 		id query int false "project id"
// @Success 	200 {array} response.projectRes
// @Failure		401 {object} response.ErrAPI "authentication required"
// @Failure		404 {object} response.ErrAPI "project not found"
// @Router 		/v1/projects/candidates [get]
func (r *projectRoutes) getCandidates(c *gin.Context) {
	userID := utils.Must(r.contextmanager.GetUserID(c))
	q := c.Query("id")
	var projectID int
	if q != "" {
		projectID = utils.Must(strconv.Atoi(q))
	}
	res, err := r.u.GetCandidates(c, userID, projectID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewUserSimpleResFromDTOBatch(res))
}

func NewProjectRouter(
	router *gin.RouterGroup,
	u usecase.Project,
	authMW gin.HandlerFunc,
	errHandler customerrors.ErrorHandler,
	contextmanager contextmanager.Gin,
) {
	r := &projectRoutes{u: u, contextmanager: contextmanager, errHandler: errHandler}
	g := router.Group("/projects")
	g.POST(":id/members", authMW, r.addMembers)
	g.GET("candidates", authMW, r.getCandidates)
	g.GET(":id", authMW, r.getByID)
	g.POST("", authMW, r.create)
	g.GET("", authMW, r.getProjects)
}
