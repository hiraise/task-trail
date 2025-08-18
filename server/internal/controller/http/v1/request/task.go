package request

import (
	"task-trail/internal/usecase/dto"

	"github.com/gin-gonic/gin"
)

type taskCreateReq struct {
	Name        string  `json:"name" binding:"required,min=6,max=254"`
	Description *string `json:"description,omitempty"`
	ProjectID   int     `json:"projectId" validate:"required,gte=1"`
	AssigneeID  *int    `json:"assigneeId,omitempty" validate:"gte=1"`
	StatusID    *int    `json:"statusId,omitempty" validate:"gte=1"`
}

func BindTaskCreateDTO(c *gin.Context, userID int) (*dto.TaskCreate, error) {
	body, err := validate[taskCreateReq](c)
	if err != nil {
		return nil, err
	}
	return &dto.TaskCreate{
			Name:        body.Name,
			Description: body.Description,
			AuthorID:    userID,
			ProjectID:   body.ProjectID,
			AssigneeID:  body.AssigneeID,
			StatusID:    body.StatusID,
		},
		nil
}
