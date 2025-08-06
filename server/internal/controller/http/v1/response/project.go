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
type rights struct {
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
}
type projectRes struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	TaskCount   int       `json:"tasksCount"`
	Rights      []*rights `json:"rights"`
}

type projectMemberRes struct {
	ID       int      `json:"id"`
	Email    string   `json:"email"`
	Username *string  `json:"username"`
	Roles    []string `json:"roles"`
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
	var r []*rights
	for _, right := range data.Rights {
		r = append(r, &rights{Role: right.Role, Permissions: right.Permissions})
	}
	return &projectRes{
		ID:          data.ID,
		Name:        data.Name,
		Description: data.Description,
		CreatedAt:   data.CreatedAt,
		TaskCount:   data.TaskCount,
		Rights:      r,
	}
}

func ProjectMemberResFromDTO(data *dto.ProjectMember) *projectMemberRes {
	return &projectMemberRes{
		ID:       data.ID,
		Email:    data.Email,
		Username: data.Username,
		Roles:    data.Roles,
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
