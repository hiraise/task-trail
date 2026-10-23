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
		var parent *entity.Task
		if data.ParentID != nil {
			if parent, err = e.parent(ctx, *data.ParentID); err != nil {
				return err
			}
		}
		number, err := e.projects.NextTaskNumber(ctx, project.ID)
		if err != nil {
			return err
		}
		if task, err = s.factory.New(author, project.Key, number, entity.TaskDraft{Name: data.Name, Description: data.Description, Status: data.Status, Priority: data.Priority, DueDate: data.DueDate}, assignee); err != nil {
			return err
		}
		// The project is locked above; a parent of another project fails AttachTo (ADR-0036)
		if parent != nil {
			if err := task.AttachTo(parent, false, task.CreatedAt); err != nil {
				return err
			}
		}
		if err := e.tasks.Create(ctx, task); err != nil {
			return err
		}
		return e.record(ctx, e.newEvent.New(task.ID, author.UserID, entity.EventCreated, task.CreatedAt))
	}
	if err := e.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return task, nil
}

// UpdateTaskService changes the name and description; one "edited" event per request if either
// changed (ADR-0028).
type UpdateTaskService struct {
	editor *editor
}

func (s *UpdateTaskService) Execute(ctx context.Context, userID, taskID string, changes dto.TaskChanges) (*entity.Task, error) {
	e := s.editor
	return e.edit(ctx, userID, taskID, nil, func(_ context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
		name, description := task.Name, task.Description
		if changes.Name != nil {
			task.Rename(*changes.Name, now)
		}
		if changes.DescriptionSet {
			task.Describe(changes.Description, now)
		}
		if task.Name == name && equal(task.Description, description) {
			return nil, nil
		}
		return []*entity.TaskEvent{e.newEvent.New(task.ID, entity.UserID(userID), entity.EventEdited, now)}, nil
	})
}

type ChangeStatusService struct {
	editor *editor
}

func (s *ChangeStatusService) Execute(ctx context.Context, userID, taskID string, status entity.TaskStatus) (*entity.Task, error) {
	e := s.editor
	return e.edit(ctx, userID, taskID, nil, func(_ context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
		from := task.Status
		task.ChangeStatus(status, now)
		if from == status {
			return nil, nil
		}
		return []*entity.TaskEvent{e.newEvent.StatusChanged(task.ID, entity.UserID(userID), from, status, now)}, nil
	})
}

// ChangePriorityService changes the priority; the same value writes no event (ADR-0033).
type ChangePriorityService struct {
	editor *editor
}

func (s *ChangePriorityService) Execute(ctx context.Context, userID, taskID string, priority entity.TaskPriority) (*entity.Task, error) {
	e := s.editor
	return e.edit(ctx, userID, taskID, nil, func(_ context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
		from := task.Priority
		if from == priority {
			return nil, nil
		}
		task.ChangePriority(priority, now)
		return []*entity.TaskEvent{e.newEvent.PriorityChanged(task.ID, entity.UserID(userID), from, priority, now)}, nil
	})
}

// ChangeDueDateService sets the due date; nil removes it, the same day writes no event (ADR-0034).
type ChangeDueDateService struct {
	editor *editor
}

func (s *ChangeDueDateService) Execute(ctx context.Context, userID, taskID string, date *time.Time) (*entity.Task, error) {
	e := s.editor
	return e.edit(ctx, userID, taskID, nil, func(_ context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
		from := task.DueDate
		if entity.SameDueDate(from, date) {
			return nil, nil
		}
		task.SetDueDate(date, now)
		return []*entity.TaskEvent{e.newEvent.DueDateChanged(task.ID, entity.UserID(userID), from, date, now)}, nil
	})
}

// ChangeAssigneeService assigns a project member; nil removes the assignee.
type ChangeAssigneeService struct {
	editor *editor
}

func (s *ChangeAssigneeService) Execute(ctx context.Context, userID, taskID string, assigneeID *string) (*entity.Task, error) {
	e := s.editor
	return e.edit(ctx, userID, taskID, nil, func(ctx context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
		assignee, err := e.assignee(ctx, task.ProjectID, assigneeID)
		if err != nil {
			return nil, err
		}
		from := task.AssigneeID
		if err := task.AssignTo(assignee, now); err != nil {
			return nil, err
		}
		if equal(from, task.AssigneeID) {
			return nil, nil
		}
		return []*entity.TaskEvent{e.newEvent.AssigneeChanged(task.ID, entity.UserID(userID), from, task.AssigneeID, now)}, nil
	})
}

// MoveTaskService moves a task to another project: a member of both projects moves it; both projects
// are active (ADR-0027).
// The task gets the next number of the new project and its key (ADR-0026); a move to the task's own
// project changes nothing. The assignee stays if they are a member of the new project. The task
// leaves its parent, and its own subtasks are detached (ADR-0036).
type MoveTaskService struct {
	editor *editor
}

func (s *MoveTaskService) Execute(ctx context.Context, userID, taskID, projectID string) (*entity.Task, error) {
	e := s.editor
	target := entity.ProjectID(projectID)
	return e.edit(ctx, userID, taskID, []entity.ProjectID{target}, func(ctx context.Context, task *entity.Task, projects map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
		if task.ProjectID == target {
			return nil, nil
		}
		if _, err := e.members.Get(ctx, target, entity.UserID(userID)); err != nil {
			return nil, err
		}
		if err := projects[target].RequireActive(); err != nil {
			return nil, err
		}
		var assignee *entity.ProjectMember
		if task.AssigneeID != nil {
			member, err := e.members.Get(ctx, target, *task.AssigneeID)
			switch {
			case err == nil:
				assignee = member
			case !domain.HasCode(err, domain.EntityNotFound):
				return nil, err
			}
		}
		number, err := e.projects.NextTaskNumber(ctx, target)
		if err != nil {
			return nil, err
		}
		fromKey, fromAssignee := task.Key(), task.AssigneeID
		parentKey, err := e.parentKey(ctx, task)
		if err != nil {
			return nil, err
		}
		task.MoveTo(target, projects[target].Key, number, assignee, now)
		// Labels do not cross projects (ADR-0035)
		if err := e.labels.ClearTask(ctx, task.ID); err != nil {
			return nil, err
		}
		task.Labels = []entity.Label{}
		actor := entity.UserID(userID)
		// "moved" goes first: the assignee is removed because of the move
		events := []*entity.TaskEvent{e.newEvent.Moved(task.ID, actor, fromKey, task.Key(), now)}
		if !equal(fromAssignee, task.AssigneeID) {
			events = append(events, e.newEvent.AssigneeChanged(task.ID, actor, fromAssignee, task.AssigneeID, now))
		}
		// A subtask leaves its parent, the subtasks of a parent stay in their project (ADR-0036)
		if parentKey != nil {
			task.Detach(now)
			events = append(events, e.newEvent.ParentChanged(task.ID, actor, parentKey, nil, now))
		}
		detached, err := e.detachSubtasks(ctx, task.ID, fromKey, actor, now)
		if err != nil {
			return nil, err
		}
		// The counters were read before the detach; the response shows the task after it
		task.SubtasksTotal, task.SubtasksDone = 0, 0
		return append(events, detached...), nil
	})
}

// SetLabelsService replaces the task's labels with labels of its project (ADR-0035); no history event.
type SetLabelsService struct {
	editor *editor
}

func (s *SetLabelsService) Execute(ctx context.Context, userID, taskID string, ids []string) (*entity.Task, error) {
	e := s.editor
	return e.edit(ctx, userID, taskID, nil, func(ctx context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
		labelIDs := make([]entity.LabelID, len(ids))
		for i, id := range ids {
			labelIDs[i] = entity.LabelID(id)
		}
		labels, err := e.labels.ListByIDs(ctx, task.ProjectID, labelIDs)
		if err != nil {
			return nil, err
		}
		// The request rejects repeated IDs, so a missing label makes the lengths differ
		if len(labels) != len(labelIDs) {
			return nil, domain.ErrLabelUnavailable("taskID", task.ID, "labelIDs", ids)
		}
		if err := e.labels.ReplaceForTask(ctx, task.ID, labelIDs); err != nil {
			return nil, err
		}
		set := make([]entity.Label, len(labels))
		for i, l := range labels {
			set[i] = *l
		}
		task.SetLabels(set, now)
		return nil, nil
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
		if (t.ArchivedAt != nil) == archived {
			task = t
			return nil
		}
		kind := entity.EventRestored
		if archived {
			t.Archive(now)
			kind = entity.EventArchived
		} else {
			t.Restore(now)
		}
		if err := e.tasks.Update(ctx, t); err != nil {
			return err
		}
		if err := e.record(ctx, e.newEvent.New(t.ID, entity.UserID(userID), kind, now)); err != nil {
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
// project (ADR-0027). Its subtasks are detached and stay (ADR-0036).
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
		now := e.clock.Now()
		events, err := e.detachSubtasks(ctx, task.ID, task.Key(), entity.UserID(userID), now)
		if err != nil {
			return err
		}
		if err := e.record(ctx, events...); err != nil {
			return err
		}
		return e.tasks.SoftDelete(ctx, task.ID, now)
	})
}

// equal compares optional values: both nil or both set and equal.
func equal[T comparable](a, b *T) bool {
	return (a == nil && b == nil) || (a != nil && b != nil && *a == *b)
}
