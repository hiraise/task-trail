package request

import (
	"errors"
	"reflect"
	"task-trail/internal/usecase/dto"

	"github.com/gin-gonic/gin"
)

type taskCreateReq struct {
	Name        string  `json:"name" binding:"required,min=6,max=254"`
	Description *string `json:"description"`
	ProjectID   int     `json:"projectId" binding:"required,gte=1"`
	AssigneeID  *int    `json:"assigneeId" binding:"omitempty,gte=1"`
	StatusID    *int    `json:"statusId" binding:"omitempty,gte=1"`
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

type taskEditReq struct {
	Name        *string `json:"name" binding:"omitempty,min=6,max=254"`
	Description *string `json:"description"`
}

func BindTaskEditDTO(c *gin.Context) (*dto.TaskEdit, error) {
	body, err := validate[taskEditReq](c)
	if err != nil {
		return nil, err
	}
	retVal := &dto.TaskEdit{
		Name:        body.Name,
		Description: body.Description,
	}
	if reflect.DeepEqual(retVal, &dto.TaskEdit{}) {
		return nil, errors.New("edit task requires at least one field")
	}
	return retVal, nil
}

// type taskEditReq struct {
// 	Name        *string `json:"name" binding:"omitempty,min=6,max=254"`
// 	Description *string `json:"description"`
// 	ProjectID   *int    `json:"projectId" binding:"omitempty,gte=1"`
// 	AssigneeID  *int    `json:"assigneeId" binding:"omitempty,gte=1"`
// 	StatusID    *int    `json:"statusId" binding:"omitempty,gte=1"`
// }
