package request

import (
	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type createProjectReq struct {
	Name        string   `json:"name" binding:"required,max=254"`
	Description *string  `json:"description"`
	Emails      []string `json:"emails" binding:"max=50,dive,required,email,max=254"`
}

func (r *createProjectReq) normalize() { normalizeEmails(r.Emails) }

// renameReq is a new name or description of a project or task (UpdateProjectRequest
// and UpdateTaskRequest in the contract).
type renameReq struct {
	Name        Optional[string] `json:"name" binding:"omitnil,min=1,max=254"`
	Description Optional[string] `json:"description"`
}

type addMembersReq struct {
	Emails []string `json:"emails" binding:"required,min=1,max=50,dive,required,email,max=254"`
}

func (r *addMembersReq) normalize() { normalizeEmails(r.Emails) }

type changeRoleReq struct {
	Role string `json:"role" binding:"required,oneof=admin member"`
}

// normalizeEmails normalizes emails before validation (ADR-0016).
func normalizeEmails(emails []string) {
	for i, email := range emails {
		emails[i] = string(entity.NewEmail(email))
	}
}

// checkRename: the name cannot be null, and at least one field is required (minProperties 1).
func checkRename(sl validator.StructLevel) {
	r := sl.Current().Interface().(renameReq)
	switch {
	case r.Name.Set && r.Name.Value == nil:
		sl.ReportError(r.Name, "name", "Name", "required", "")
	case !r.Name.Set && !r.Description.Set:
		sl.ReportError(r.Name, "name", "Name", "required_without", "description")
	}
}

func BindCreateProject(c *gin.Context) (dto.CreateProject, error) {
	body, err := validate[createProjectReq](c)
	if err != nil {
		return dto.CreateProject{}, err
	}
	return dto.CreateProject{Name: body.Name, Description: body.Description, Emails: body.Emails}, nil
}

func BindUpdateProject(c *gin.Context) (dto.ProjectChanges, error) {
	body, err := validate[renameReq](c)
	if err != nil {
		return dto.ProjectChanges{}, err
	}
	return dto.ProjectChanges{
		Name:           body.Name.Value,
		DescriptionSet: body.Description.Set,
		Description:    body.Description.Value,
	}, nil
}

// BindAddMembers returns normalized emails.
func BindAddMembers(c *gin.Context) ([]string, error) {
	body, err := validate[addMembersReq](c)
	if err != nil {
		return nil, err
	}
	return body.Emails, nil
}

func BindChangeRole(c *gin.Context) (entity.ProjectRole, error) {
	body, err := validate[changeRoleReq](c)
	if err != nil {
		return "", err
	}
	return entity.ProjectRole(body.Role), nil
}
