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

// ListProjectTasksService returns the project's active or archived tasks: any member can see them.
type ListProjectTasksService struct {
	members repository.ProjectMemberRepository
	tasks   repository.TaskRepository
}

func (s *ListProjectTasksService) Execute(ctx context.Context, userID, projectID string, archived bool) ([]*entity.Task, error) {
	member, err := s.members.Get(ctx, entity.ProjectID(projectID), entity.UserID(userID))
	if err != nil {
		return nil, err
	}
	return s.tasks.ListInProject(ctx, member.ProjectID, archived)
}

// ListAssignedTasksService returns the active or archived tasks assigned to the user in all their projects.
type ListAssignedTasksService struct {
	tasks repository.TaskRepository
}

func (s *ListAssignedTasksService) Execute(ctx context.Context, userID string, archived bool) ([]*entity.Task, error) {
	return s.tasks.ListAssigned(ctx, entity.UserID(userID), archived)
}

// GetTaskService returns a task: any member of its project can see it.
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

// CreateTaskService: any project member creates a task in an active project; the assignee is also a member.
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
		if err := project.RequireActive(); err != nil {
			return err
		}
		assignee, err := e.assignee(ctx, project.ID, data.AssigneeID)
		if err != nil {
			return err
		}
		number, err := e.projects.NextTaskNumber(ctx, project.ID)
		if err != nil {
			return err
		}
		if task, err = s.factory.New(author, project.Key, number, data.Name, data.Description, assignee); err != nil {
			return err
		}
		return e.tasks.Create(ctx, task)
	}
	if err := e.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return task, nil
}

// UpdateTaskService changes the name and description.
type UpdateTaskService struct {
	editor *editor
}

func (s *UpdateTaskService) Execute(ctx context.Context, userID, taskID string, changes dto.TaskChanges) (*entity.Task, error) {
	return s.editor.edit(ctx, userID, taskID, nil, func(_ context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) error {
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
	return s.editor.edit(ctx, userID, taskID, nil, func(_ context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) error {
		task.ChangeStatus(status, now)
		return nil
	})
}

// ChangeAssigneeService assigns a project member; nil removes the assignee.
type ChangeAssigneeService struct {
	editor *editor
}

func (s *ChangeAssigneeService) Execute(ctx context.Context, userID, taskID string, assigneeID *string) (*entity.Task, error) {
	return s.editor.edit(ctx, userID, taskID, nil, func(ctx context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) error {
		assignee, err := s.editor.assignee(ctx, task.ProjectID, assigneeID)
		if err != nil {
			return err
		}
		return task.AssignTo(assignee, now)
	})
}

// MoveTaskService moves a task to another project: a member of both projects moves it; both projects
// are active (ADR-0027).
// The task gets the next number of the new project and its key (ADR-0026); a move to the task's own
// project changes nothing. The assignee stays if they are a member of the new project.
type MoveTaskService struct {
	editor *editor
}

func (s *MoveTaskService) Execute(ctx context.Context, userID, taskID, projectID string) (*entity.Task, error) {
	e := s.editor
	target := entity.ProjectID(projectID)
	return e.edit(ctx, userID, taskID, []entity.ProjectID{target}, func(ctx context.Context, task *entity.Task, projects map[entity.ProjectID]*entity.Project, now time.Time) error {
		if task.ProjectID == target {
			return nil
		}
		if _, err := e.members.Get(ctx, target, entity.UserID(userID)); err != nil {
			return err
		}
		if err := projects[target].RequireActive(); err != nil {
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
		number, err := e.projects.NextTaskNumber(ctx, target)
		if err != nil {
			return err
		}
		task.MoveTo(target, projects[target].Key, number, assignee, now)
		return nil
	})
}

// SetTaskArchivedService archives or restores a task: any member of its active project (ADR-0027).
// The same value again changes nothing.
type SetTaskArchivedService struct {
	editor *editor
}

func (s *SetTaskArchivedService) Execute(ctx context.Context, userID, taskID string, archived bool) (*entity.Task, error) {
	e := s.editor
	var task *entity.Task
	f := func(ctx context.Context) error {
		t, _, projects, err := e.lock(ctx, taskID, userID)
		if err != nil {
			return err
		}
		if err := projects[t.ProjectID].RequireActive(); err != nil {
			return err
		}
		now := e.clock.Now()
		if archived {
			t.Archive(now)
		} else {
			t.Restore(now)
		}
		if err := e.tasks.Update(ctx, t); err != nil {
			return err
		}
		task = t
		return nil
	}
	if err := e.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return task, nil
}

// DeleteTaskService soft-deletes a task (ADR-0001): an archived one too, but not in an archived
// project (ADR-0027).
type DeleteTaskService struct {
	editor *editor
}

func (s *DeleteTaskService) Execute(ctx context.Context, userID, taskID string) error {
	e := s.editor
	return e.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		task, _, projects, err := e.lock(ctx, taskID, userID)
		if err != nil {
			return err
		}
		if err := projects[task.ProjectID].RequireActive(); err != nil {
			return err
		}
		return e.tasks.SoftDelete(ctx, task.ID, e.clock.Now())
	})
}
