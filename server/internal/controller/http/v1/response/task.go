package response

import (
	"task-trail/internal/usecase/dto"
	"time"
)

type taskListRes struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	AuthorID    int       `json:"authorId"`
	AssigneeID  *int      `json:"assigneeId"`
	StatusID    *int      `json:"statusId"`
}

type taskCreateRes struct {
	ID int `json:"id"`
}

func TaskListResFromDTO(data *dto.TaskListRes) *taskListRes {
	return &taskListRes{
		ID:          data.ID,
		Name:        data.Name,
		Description: data.Description,
		CreatedAt:   data.CreatedAt,
		UpdatedAt:   data.UpdatedAt,
		AuthorID:    data.AuthorID,
		AssigneeID:  data.AssigneeID,
		StatusID:    data.StatusID,
	}
}

func TaskListResFromDTOBatch(data []*dto.TaskListRes) []*taskListRes {
	if len(data) == 0 {
		return []*taskListRes{}
	}
	var retVal []*taskListRes
	for _, v := range data {
		retVal = append(retVal, TaskListResFromDTO(v))
	}
	return retVal
}

func TaskCreateResFromDTO(ID int) *taskCreateRes {
	return &taskCreateRes{ID: ID}
}
