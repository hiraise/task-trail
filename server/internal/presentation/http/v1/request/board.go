package request

import (
	"task-trail/internal/application/dto"

	"github.com/gin-gonic/gin"
)

// createBoardReq — CreateBoardRequest: 1–50 projects and 0–50 members (ADR-0029).
type createBoardReq struct {
	Name       string   `json:"name" binding:"required,max=200"`
	ProjectIDs []string `json:"projectIds" binding:"required,min=1,max=50,dive,uuid"`
	MemberIDs  []string `json:"memberIds" binding:"max=50,dive,uuid"`
}

func (r *createBoardReq) normalize() {
	normalizeIDs(r.ProjectIDs)
	normalizeIDs(r.MemberIDs)
}

type updateBoardReq struct {
	Name string `json:"name" binding:"required,max=200"`
}

type setBoardProjectsReq struct {
	ProjectIDs []string `json:"projectIds" binding:"required,min=1,max=50,dive,uuid"`
}

func (r *setBoardProjectsReq) normalize() { normalizeIDs(r.ProjectIDs) }

type addBoardMembersReq struct {
	UserIDs []string `json:"userIds" binding:"required,min=1,max=50,dive,uuid"`
}

func (r *addBoardMembersReq) normalize() { normalizeIDs(r.UserIDs) }

func normalizeIDs(ids []string) {
	for i := range ids {
		normalizeID(&ids[i])
	}
}

func BindCreateBoard(c *gin.Context) (dto.CreateBoard, error) {
	body, err := validate[createBoardReq](c)
	if err != nil {
		return dto.CreateBoard{}, err
	}
	return dto.CreateBoard{Name: body.Name, ProjectIDs: body.ProjectIDs, MemberIDs: body.MemberIDs}, nil
}

// BindUpdateBoard returns the new board name.
func BindUpdateBoard(c *gin.Context) (string, error) {
	body, err := validate[updateBoardReq](c)
	if err != nil {
		return "", err
	}
	return body.Name, nil
}

func BindSetBoardProjects(c *gin.Context) ([]string, error) {
	body, err := validate[setBoardProjectsReq](c)
	if err != nil {
		return nil, err
	}
	return body.ProjectIDs, nil
}

func BindAddBoardMembers(c *gin.Context) ([]string, error) {
	body, err := validate[addBoardMembersReq](c)
	if err != nil {
		return nil, err
	}
	return body.UserIDs, nil
}
