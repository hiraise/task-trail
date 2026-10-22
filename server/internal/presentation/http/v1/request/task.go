package request

import (
	"strings"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type createTaskReq struct {
	ProjectID   string  `json:"projectId" binding:"required,uuid"`
	Name        string  `json:"name" binding:"required,max=254"`
	Description *string `json:"description"`
	AssigneeID  *string `json:"assigneeId" binding:"omitnil,uuid"`
}

func (r *createTaskReq) normalize() {
	normalizeID(&r.ProjectID)
	normalizeID(r.AssigneeID)
}

type changeTaskStatusReq struct {
	StatusID string `json:"statusId" binding:"required,taskstatus"`
}

type changeTaskAssigneeReq struct {
	AssigneeID Optional[string] `json:"assigneeId" binding:"omitnil,uuid"`
}

func (r *changeTaskAssigneeReq) normalize() { normalizeID(r.AssigneeID.Value) }

type moveTaskReq struct {
	ProjectID string `json:"projectId" binding:"required,uuid"`
}

func (r *moveTaskReq) normalize() { normalizeID(&r.ProjectID) }

// normalizeID приводит UUID из тела к нижнему регистру, как его хранит и отдаёт PostgreSQL:
// иначе ID из запроса и из базы не совпадут при сравнении.
func normalizeID(id *string) {
	if id != nil {
		*id = strings.ToLower(*id)
	}
}

// requireAssignee: исполнитель обязателен в запросе, null — снять исполнителя
// (ChangeTaskAssigneeRequest в контракте).
func requireAssignee(sl validator.StructLevel) {
	if r := sl.Current().Interface().(changeTaskAssigneeReq); !r.AssigneeID.Set {
		sl.ReportError(r.AssigneeID, "assigneeId", "AssigneeID", "required", "")
	}
}

func taskStatus(fl validator.FieldLevel) bool {
	return entity.TaskStatus(fl.Field().String()).Valid()
}

func BindCreateTask(c *gin.Context) (dto.CreateTask, error) {
	body, err := validate[createTaskReq](c)
	if err != nil {
		return dto.CreateTask{}, err
	}
	return dto.CreateTask{ProjectID: body.ProjectID, Name: body.Name, Description: body.Description, AssigneeID: body.AssigneeID}, nil
}

func BindUpdateTask(c *gin.Context) (dto.TaskChanges, error) {
	body, err := validate[renameReq](c)
	if err != nil {
		return dto.TaskChanges{}, err
	}
	return dto.TaskChanges{
		Name:           body.Name.Value,
		DescriptionSet: body.Description.Set,
		Description:    body.Description.Value,
	}, nil
}

func BindChangeTaskStatus(c *gin.Context) (entity.TaskStatus, error) {
	body, err := validate[changeTaskStatusReq](c)
	if err != nil {
		return "", err
	}
	return entity.TaskStatus(body.StatusID), nil
}

// BindChangeTaskAssignee возвращает исполнителя; nil — снять исполнителя.
func BindChangeTaskAssignee(c *gin.Context) (*string, error) {
	body, err := validate[changeTaskAssigneeReq](c)
	if err != nil {
		return nil, err
	}
	return body.AssigneeID.Value, nil
}

// BindMoveTask возвращает ID проекта, куда перенести задачу.
func BindMoveTask(c *gin.Context) (string, error) {
	body, err := validate[moveTaskReq](c)
	if err != nil {
		return "", err
	}
	return body.ProjectID, nil
}
