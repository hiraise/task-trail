package request

import (
	"task-trail/internal/usecase/dto"

	"github.com/gin-gonic/gin"
)

type projectCreateReq struct {
	Name        string `json:"name" binding:"required,max=254"`
	Description string `json:"description"`
}

type projectAddMembersReq struct {
	Emails []string `json:"emails" binding:"required" `
}

func BindProjectCreateDTO(c *gin.Context, userID int) (*dto.ProjectCreate, error) {
	body, err := validate[projectCreateReq](c)
	if err != nil {
		return nil, err
	}
	return &dto.ProjectCreate{Name: body.Name, Description: body.Description, OwnerID: userID}, nil
}

func BindProjectListDTO(c *gin.Context, userID int) (*dto.ProjectList, error) {
	return &dto.ProjectList{MemberID: userID}, nil
}

func BindProjectAddMembersDTO(c *gin.Context, userID int, projectID int) (*dto.ProjectAddMembers, error) {
	body, err := validate[projectAddMembersReq](c)
	if err != nil {
		return nil, err
	}
	return &dto.ProjectAddMembers{OwnerID: userID, MemberEmails: body.Emails, ProjectID: projectID}, nil
}
