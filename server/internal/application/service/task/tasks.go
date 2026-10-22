package task

import (
	"context"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
)

// ListProjectTasksService — задачи проекта: видит любой участник.
type ListProjectTasksService struct {
	members repository.ProjectMemberRepository
	tasks   repository.TaskRepository
}

func (s *ListProjectTasksService) Execute(ctx context.Context, userID, projectID string) ([]*entity.Task, error) {
	member, err := s.members.Get(ctx, entity.ProjectID(projectID), entity.UserID(userID))
	if err != nil {
		return nil, err
	}
	return s.tasks.ListInProject(ctx, member.ProjectID)
}

// ListAssignedTasksService — задачи, назначенные на пользователя, во всех его проектах.
type ListAssignedTasksService struct {
	tasks repository.TaskRepository
}

func (s *ListAssignedTasksService) Execute(ctx context.Context, userID string) ([]*entity.Task, error) {
	return s.tasks.ListAssigned(ctx, entity.UserID(userID))
}

// GetTaskService — задача: видит любой участник её проекта.
type GetTaskService struct {
	members repository.ProjectMemberRepository
	tasks   repository.TaskRepository
}

func (s *GetTaskService) Execute(ctx context.Context, userID, taskID string) (*entity.Task, error) {
	task, err := s.tasks.Get(ctx, entity.TaskID(taskID))
	if err != nil {
		return nil, err
	}
	if _, err := s.members.Get(ctx, task.ProjectID, entity.UserID(userID)); err != nil {
		return nil, err
	}
	return task, nil
}

// CreateTaskService — задачу создаёт любой участник проекта; исполнитель — тоже участник.
type CreateTaskService struct {
	editor  *editor
	factory *factory.TaskFactory
}

func (s *CreateTaskService) Execute(ctx context.Context, userID string, data dto.CreateTask) (*entity.Task, error) {
	e := s.editor
	var task *entity.Task
	f := func(ctx context.Context) error {
		project, err := e.projects.GetForUpdate(ctx, entity.ProjectID(data.ProjectID))
		if err != nil {
			return err
		}
		author, err := e.members.Get(ctx, project.ID, entity.UserID(userID))
		if err != nil {
			return err
		}
		assignee, err := e.assignee(ctx, project.ID, data.AssigneeID)
		if err != nil {
			return err
		}
		if task, err = s.factory.New(author, data.Name, data.Description, assignee); err != nil {
			return err
		}
		return e.tasks.Create(ctx, task)
	}
	if err := e.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return task, nil
}

// UpdateTaskService меняет название и описание.
type UpdateTaskService struct {
	editor *editor
}

func (s *UpdateTaskService) Execute(ctx context.Context, userID, taskID string, changes dto.TaskChanges) (*entity.Task, error) {
	return s.editor.edit(ctx, userID, taskID, nil, func(_ context.Context, task *entity.Task, now time.Time) error {
		if changes.Name != nil {
			task.Rename(*changes.Name, now)
		}
		if changes.DescriptionSet {
			task.Describe(changes.Description, now)
		}
		return nil
	})
}

type ChangeStatusService struct {
	editor *editor
}

func (s *ChangeStatusService) Execute(ctx context.Context, userID, taskID string, status entity.TaskStatus) (*entity.Task, error) {
	return s.editor.edit(ctx, userID, taskID, nil, func(_ context.Context, task *entity.Task, now time.Time) error {
		task.ChangeStatus(status, now)
		return nil
	})
}

// ChangeAssigneeService назначает исполнителя из участников проекта; nil снимает исполнителя.
type ChangeAssigneeService struct {
	editor *editor
}

func (s *ChangeAssigneeService) Execute(ctx context.Context, userID, taskID string, assigneeID *string) (*entity.Task, error) {
	return s.editor.edit(ctx, userID, taskID, nil, func(ctx context.Context, task *entity.Task, now time.Time) error {
		assignee, err := s.editor.assignee(ctx, task.ProjectID, assigneeID)
		if err != nil {
			return err
		}
		return task.AssignTo(assignee, now)
	})
}

// MoveTaskService переносит задачу в другой проект: переносит участник обоих проектов.
// Исполнитель остаётся, если он участник нового проекта.
type MoveTaskService struct {
	editor *editor
}

func (s *MoveTaskService) Execute(ctx context.Context, userID, taskID, projectID string) (*entity.Task, error) {
	e := s.editor
	target := entity.ProjectID(projectID)
	return e.edit(ctx, userID, taskID, []entity.ProjectID{target}, func(ctx context.Context, task *entity.Task, now time.Time) error {
		if _, err := e.members.Get(ctx, target, entity.UserID(userID)); err != nil {
			return err
		}
		var assignee *entity.ProjectMember
		if task.AssigneeID != nil {
			member, err := e.members.Get(ctx, target, *task.AssigneeID)
			switch {
			case err == nil:
				assignee = member
			case !domain.HasCode(err, domain.EntityNotFound):
				return err
			}
		}
		task.MoveTo(target, assignee, now)
		return nil
	})
}

// DeleteTaskService удаляет задачу мягко (ADR-0001).
type DeleteTaskService struct {
	editor *editor
}

func (s *DeleteTaskService) Execute(ctx context.Context, userID, taskID string) error {
	e := s.editor
	return e.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		task, _, err := e.lock(ctx, taskID, userID)
		if err != nil {
			return err
		}
		return e.tasks.SoftDelete(ctx, task.ID, e.clock.Now())
	})
}
