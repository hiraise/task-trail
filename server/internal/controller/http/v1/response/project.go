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

type projectTaskStatusRes struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	IsDefault  bool   `json:"isDefault"`
	IsResolved bool   `json:"isResolved"`
}

func ProjectListResFromDTO(data *dto.ProjectListRes) *projectListRes {
	return &projectListRes{
		ID:          data.ID,
		Name:        data.Name,
		Description: data.Description,
		CreatedAt:   data.CreatedAt,
		TaskCount:   data.TaskCount,
	}
}

func ProjectListResFromDTOBatch(data []*dto.ProjectListRes) []*projectListRes {
	if len(data) == 0 {
		return []*projectListRes{}
	}
	var retVal []*projectListRes
	for _, v := range data {
		retVal = append(retVal, ProjectListResFromDTO(v))
	}
	return retVal
}

func ProjectCreateResFromDTO(projectID int) *projectCreateRes {
	return &projectCreateRes{ID: projectID}
}

func ProjecResFromDTO(data *dto.ProjectRes) *projectRes {
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

func ProjectTaskStatusResFromDTO(data *dto.ProjectStatus) *projectTaskStatusRes {
	return &projectTaskStatusRes{
		ID:         data.ID,
		Name:       data.Name,
		IsDefault:  data.IsDefault,
		IsResolved: data.IsResolved,
	}
}

func ProjectTaskStatusResFromDTOBatch(data []*dto.ProjectStatus) []*projectTaskStatusRes {
	if len(data) == 0 {
		return []*projectTaskStatusRes{}
	}
	var retVal []*projectTaskStatusRes
	for _, v := range data {
		retVal = append(retVal, ProjectTaskStatusResFromDTO(v))
	}
	return retVal
}
