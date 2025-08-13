package response

import (
	"task-trail/internal/usecase/dto"
	"time"
)

type projectListRes struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	TaskCount   int       `json:"tasksCount"`
}

type projectRes struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	TaskCount   int       `json:"tasksCount"`
	Permissions []string  `json:"permissions"`
}

type projectMemberRes struct {
	ID          int      `json:"id"`
	Email       string   `json:"email"`
	Username    *string  `json:"username"`
	Permissions []string `json:"permissions"`
}

type projectCreateRes struct {
	ID int `json:"id"`
}

func NewProjectListResFromDTO(data *dto.ProjectListRes) *projectListRes {
	return &projectListRes{
		ID:          data.ID,
		Name:        data.Name,
		Description: data.Description,
		CreatedAt:   data.CreatedAt,
		TaskCount:   data.TaskCount,
	}
}

func NewProjectListResFromDTOBatch(data []*dto.ProjectListRes) []*projectListRes {
	if len(data) == 0 {
		return []*projectListRes{}
	}
	var retVal []*projectListRes
	for _, v := range data {
		retVal = append(retVal, NewProjectListResFromDTO(v))
	}
	return retVal
}

func NewProjectCreateResFromDTO(projectID int) *projectCreateRes {
	return &projectCreateRes{ID: projectID}
}

func NewProjecResFromDTO(data *dto.ProjectRes) *projectRes {
	return &projectRes{
		ID:          data.ID,
		Name:        data.Name,
		Description: data.Description,
		CreatedAt:   data.CreatedAt,
		TaskCount:   data.TaskCount,
		Permissions: data.Permissions,
	}
}

func ProjectMemberResFromDTO(data *dto.ProjectMember) *projectMemberRes {
	return &projectMemberRes{
		ID:          data.ID,
		Email:       data.Email,
		Username:    data.Username,
		Permissions: data.Permissions,
	}
}

func ProjectMemberResFromDTOBatch(data []*dto.ProjectMember) []*projectMemberRes {
	if len(data) == 0 {
		return []*projectMemberRes{}
	}
	var retVal []*projectMemberRes
	for _, v := range data {
		retVal = append(retVal, ProjectMemberResFromDTO(v))
	}
	return retVal
}
