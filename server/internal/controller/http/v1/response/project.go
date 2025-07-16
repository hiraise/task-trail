package response

import (
	"task-trail/internal/usecase/dto"
	"time"
)

type projectRes struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	TaskCount   int       `json:"tasksCount"`
}

type projectCreateRes struct {
	ID int `json:"id"`
}

func NewProjectResFromDTO(data *dto.ProjectRes) *projectRes {
	return &projectRes{
		ID:          data.ID,
		Name:        data.Name,
		Description: data.Description,
		CreatedAt:   data.CreatedAt,
		TaskCount:   data.TaskCount,
	}
}

func NewProjectResFromDTOBatch(data []*dto.ProjectRes) []*projectRes {
	if len(data) == 0 {
		return []*projectRes{}
	}
	var retVal []*projectRes
	for _, v := range data {
		retVal = append(retVal, NewProjectResFromDTO(v))
	}
	return retVal
}

func NewProjectCreateResFromDTO(projectID int) *projectCreateRes {
	return &projectCreateRes{ID: projectID}
}
