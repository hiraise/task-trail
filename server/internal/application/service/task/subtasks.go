package task

import (
	"context"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
)

// ChangeParentService attaches a task to a parent of its project or detaches it (ADR-0036): any member;
// the task, its project and the parent are active. A parent_changed event on the task only.
type ChangeParentService struct {
	editor *editor
}

func (s *ChangeParentService) Execute(ctx context.Context, userID, taskID string, parentID *string) (*entity.Task, error) {
	e := s.editor
	return e.edit(ctx, userID, taskID, nil, func(ctx context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
		if equal(task.ParentID, (*entity.TaskID)(parentID)) {
			return nil, nil
		}
		fromKey, err := e.parentKey(ctx, task)
		if err != nil {
			return nil, err
		}
		actor := entity.UserID(userID)
		if parentID == nil {
			task.Detach(now)
			return []*entity.TaskEvent{e.newEvent.ParentChanged(task.ID, actor, fromKey, nil, now)}, nil
		}
		parent, err := e.parent(ctx, *parentID)
		if err != nil {
			return nil, err
		}
		has, err := e.tasks.HasSubtasks(ctx, task.ID)
		if err != nil {
			return nil, err
		}
		if err := task.AttachTo(parent, has, now); err != nil {
			return nil, err
		}
		toKey := parent.Key()
		return []*entity.TaskEvent{e.newEvent.ParentChanged(task.ID, actor, fromKey, &toKey, now)}, nil
	})
}

// ListSubtasksService returns the task's subtasks by number, archived ones included: any member
// of its project (ADR-0036).
type ListSubtasksService struct {
	feed *feed
}

func (s *ListSubtasksService) Execute(ctx context.Context, userID, taskID string) ([]*entity.Task, error) {
	task, err := s.feed.task(ctx, userID, taskID)
	if err != nil {
		return nil, err
	}
	return s.feed.tasks.ListSubtasks(ctx, task.ID)
}

// parent finds the parent named in a request. A missing one is TASK_PARENT_INVALID: an error in
// the request data, not a missing resource of the path. A parent of another project is found too,
// AttachTo refuses it.
func (e *editor) parent(ctx context.Context, parentID string) (*entity.Task, error) {
	parent, err := e.tasks.Get(ctx, entity.TaskID(parentID))
	if domain.HasCode(err, domain.EntityNotFound) {
		return nil, domain.ErrTaskParentInvalid("parentID", parentID)
	}
	return parent, err
}

// parentKey — the key of the task's parent, nil — the task is not a subtask.
func (e *editor) parentKey(ctx context.Context, task *entity.Task) (*string, error) {
	if task.ParentID == nil {
		return nil, nil
	}
	parent, err := e.tasks.Get(ctx, *task.ParentID)
	if err != nil {
		return nil, err
	}
	key := parent.Key()
	return &key, nil
}

// detachSubtasks detaches the subtasks of the task with key parentKey, which is moved or deleted,
// and returns a parent_changed event for each of them (ADR-0036).
func (e *editor) detachSubtasks(ctx context.Context, parentID entity.TaskID, parentKey string, actor entity.UserID, now time.Time) ([]*entity.TaskEvent, error) {
	ids, err := e.tasks.DetachSubtasks(ctx, parentID, now)
	if err != nil {
		return nil, err
	}
	events := make([]*entity.TaskEvent, len(ids))
	for i, id := range ids {
		events[i] = e.newEvent.ParentChanged(id, actor, &parentKey, nil, now)
	}
	return events, nil
}
