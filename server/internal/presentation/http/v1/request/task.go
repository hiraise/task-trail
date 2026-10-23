package request

import (
	"strings"
	"time"

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
	StatusID    *string `json:"statusId" binding:"omitnil,taskstatus"`
	Priority    *string `json:"priority" binding:"omitnil,taskpriority"`
	DueDate     *string `json:"dueDate" binding:"omitnil,datetime=2006-01-02"`
	ParentID    *string `json:"parentId" binding:"omitnil,uuid"`
}

func (r *createTaskReq) normalize() {
	normalizeID(&r.ProjectID)
	normalizeID(r.AssigneeID)
	normalizeID(r.ParentID)
}

type changeTaskStatusReq struct {
	StatusID string `json:"statusId" binding:"required,taskstatus"`
}

type changeTaskPriorityReq struct {
	Priority string `json:"priority" binding:"required,taskpriority"`
}

// changeTaskDueDateReq — ChangeTaskDueDateRequest: datetime also rejects days like 2026-02-30.
type changeTaskDueDateReq struct {
	DueDate Optional[string] `json:"dueDate" binding:"omitnil,datetime=2006-01-02"`
}

type changeTaskAssigneeReq struct {
	AssigneeID Optional[string] `json:"assigneeId" binding:"omitnil,uuid"`
}

func (r *changeTaskAssigneeReq) normalize() { normalizeID(r.AssigneeID.Value) }

type changeTaskParentReq struct {
	ParentID Optional[string] `json:"parentId" binding:"omitnil,uuid"`
}

// normalize: an upper-case UUID must compare equal to the stored parent.
func (r *changeTaskParentReq) normalize() { normalizeID(r.ParentID.Value) }

type moveTaskReq struct {
	ProjectID string `json:"projectId" binding:"required,uuid"`
}

func (r *moveTaskReq) normalize() { normalizeID(&r.ProjectID) }

// setArchivedReq — SetArchivedRequest: a pointer, so that required tells a missing field from false.
type setArchivedReq struct {
	Archived *bool `json:"archived" binding:"required"`
}

// normalizeID lowercases a UUID from the body, as PostgreSQL stores and returns it:
// otherwise IDs from the request and the database would not match when compared.
func normalizeID(id *string) {
	if id != nil {
		*id = strings.ToLower(*id)
	}
}

// requireAssignee: the assignee is required in the request, null removes the assignee
// (ChangeTaskAssigneeRequest in the contract).
func requireAssignee(sl validator.StructLevel) {
	if r := sl.Current().Interface().(changeTaskAssigneeReq); !r.AssigneeID.Set {
		sl.ReportError(r.AssigneeID, "assigneeId", "AssigneeID", "required", "")
	}
}

// requireParent: the parent is required in the request, null detaches the task
// (ChangeTaskParentRequest in the contract).
func requireParent(sl validator.StructLevel) {
	if r := sl.Current().Interface().(changeTaskParentReq); !r.ParentID.Set {
		sl.ReportError(r.ParentID, "parentId", "ParentID", "required", "")
	}
}

// requireDueDate: the due date is required in the request, null removes it
// (ChangeTaskDueDateRequest in the contract).
func requireDueDate(sl validator.StructLevel) {
	if r := sl.Current().Interface().(changeTaskDueDateReq); !r.DueDate.Set {
		sl.ReportError(r.DueDate, "dueDate", "DueDate", "required", "")
	}
}

func taskStatus(fl validator.FieldLevel) bool {
	return entity.TaskStatus(fl.Field().String()).Valid()
}

func taskPriority(fl validator.FieldLevel) bool {
	return entity.TaskPriority(fl.Field().String()).Valid()
}

func BindCreateTask(c *gin.Context) (dto.CreateTask, error) {
	body, err := validate[createTaskReq](c)
	if err != nil {
		return dto.CreateTask{}, err
	}
	status := entity.DefaultTaskStatus()
	if body.StatusID != nil {
		status = entity.TaskStatus(*body.StatusID)
	}
	priority := entity.PriorityNormal
	if body.Priority != nil {
		priority = entity.TaskPriority(*body.Priority)
	}
	dueDate, err := parseDueDate(body.DueDate)
	if err != nil {
		return dto.CreateTask{}, err
	}
	return dto.CreateTask{
		ProjectID: body.ProjectID, Name: body.Name, Description: body.Description, AssigneeID: body.AssigneeID,
		Status: status, Priority: priority, DueDate: dueDate, ParentID: body.ParentID,
	}, nil
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

func BindChangeTaskPriority(c *gin.Context) (entity.TaskPriority, error) {
	body, err := validate[changeTaskPriorityReq](c)
	if err != nil {
		return "", err
	}
	return entity.TaskPriority(body.Priority), nil
}

// BindChangeTaskDueDate returns the due date; nil removes it.
func BindChangeTaskDueDate(c *gin.Context) (*time.Time, error) {
	body, err := validate[changeTaskDueDateReq](c)
	if err != nil {
		return nil, err
	}
	return parseDueDate(body.DueDate.Value)
}

// parseDueDate parses a due date the validator has already checked; nil stays nil.
func parseDueDate(s *string) (*time.Time, error) {
	if s == nil {
		return nil, nil
	}
	date, err := entity.ParseDueDate(*s)
	if err != nil {
		return nil, err
	}
	return &date, nil
}

// BindChangeTaskAssignee returns the assignee; nil removes the assignee.
func BindChangeTaskAssignee(c *gin.Context) (*string, error) {
	body, err := validate[changeTaskAssigneeReq](c)
	if err != nil {
		return nil, err
	}
	return body.AssigneeID.Value, nil
}

// BindChangeTaskParent returns the parent; nil detaches the task (ADR-0036).
func BindChangeTaskParent(c *gin.Context) (*string, error) {
	body, err := validate[changeTaskParentReq](c)
	if err != nil {
		return nil, err
	}
	return body.ParentID.Value, nil
}

// BindMoveTask returns the ID of the project to move the task to.
func BindMoveTask(c *gin.Context) (string, error) {
	body, err := validate[moveTaskReq](c)
	if err != nil {
		return "", err
	}
	return body.ProjectID, nil
}

// BindSetArchived returns whether to archive (true) or restore (false) a task or a project.
func BindSetArchived(c *gin.Context) (bool, error) {
	body, err := validate[setArchivedReq](c)
	if err != nil {
		return false, err
	}
	return *body.Archived, nil
}

// commentReq — CreateCommentRequest and UpdateCommentRequest: spaces at the ends are trimmed
// before validation (ADR-0028).
type commentReq struct {
	Text string `json:"text" binding:"required,max=10000"`
}

func (r *commentReq) normalize() { r.Text = strings.TrimSpace(r.Text) }

// BindComment returns the trimmed comment text.
func BindComment(c *gin.Context) (string, error) {
	body, err := validate[commentReq](c)
	if err != nil {
		return "", err
	}
	return body.Text, nil
}
