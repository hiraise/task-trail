// Package task holds the task use cases: each change is its own operation (ADR-0002), statuses
// are fixed (ADR-0003), deletion is soft (ADR-0001). Any member of a task's project sees and changes
// it; a non-member gets ENTITY_NOT_FOUND: the task's existence is not revealed (ADR-0018).
package task

import (
	"context"
	"slices"
	"time"

	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

type TaskModule struct {
	ListInProject  *ListProjectTasksService
	ListAssigned   *ListAssignedTasksService
	Get            *GetTaskService
	Create         *CreateTaskService
	Update         *UpdateTaskService
	ChangeStatus   *ChangeStatusService
	ChangeAssignee *ChangeAssigneeService
	Move           *MoveTaskService
	Delete         *DeleteTaskService
}

// Deps are the dependencies of the task module.
type Deps struct {
	TxManager   transaction.TxManager
	Clock       service.Clock
	ProjectRepo repository.ProjectRepository
	MemberRepo  repository.ProjectMemberRepository
	TaskRepo    repository.TaskRepository
	TaskFactory *factory.TaskFactory
}

func New(d Deps) *TaskModule {
	e := &editor{txManager: d.TxManager, clock: d.Clock, projects: d.ProjectRepo, members: d.MemberRepo, tasks: d.TaskRepo}
	return &TaskModule{
		ListInProject:  &ListProjectTasksService{members: d.MemberRepo, tasks: d.TaskRepo},
		ListAssigned:   &ListAssignedTasksService{tasks: d.TaskRepo},
		Get:            &GetTaskService{members: d.MemberRepo, tasks: d.TaskRepo},
		Create:         &CreateTaskService{editor: e, factory: d.TaskFactory},
		Update:         &UpdateTaskService{editor: e},
		ChangeStatus:   &ChangeStatusService{editor: e},
		ChangeAssignee: &ChangeAssigneeService{editor: e},
		Move:           &MoveTaskService{editor: e},
		Delete:         &DeleteTaskService{editor: e},
	}
}

// editor changes tasks under the lock of their project (TaskRepository).
type editor struct {
	txManager transaction.TxManager
	clock     service.Clock
	projects  repository.ProjectRepository
	members   repository.ProjectMemberRepository
	tasks     repository.TaskRepository
}

// lock locks the task's project and the also projects until the end of the transaction and finds the task
// and userID's membership in its project.
func (e *editor) lock(ctx context.Context, taskID, userID string, also ...entity.ProjectID) (*entity.Task, *entity.ProjectMember, error) {
	task, err := e.tasks.Get(ctx, entity.TaskID(taskID))
	if err != nil {
		return nil, nil, err
	}
	locked := map[entity.ProjectID]bool{}
	for !locked[task.ProjectID] {
		if err := e.lockProjects(ctx, locked, append([]entity.ProjectID{task.ProjectID}, also...)); err != nil {
			return nil, nil, err
		}
		// While waiting for the lock, the task may have been moved or deleted. Now, if its project
		// is locked, the task does not change until the end of the transaction
		if task, err = e.tasks.Get(ctx, task.ID); err != nil {
			return nil, nil, err
		}
	}
	member, err := e.members.Get(ctx, task.ProjectID, entity.UserID(userID))
	if err != nil {
		return nil, nil, err
	}
	return task, member, nil
}

// lockProjects locks the ids projects, except those already locked, in ascending ID order: this way
// two opposite task moves do not wait for each other.
func (e *editor) lockProjects(ctx context.Context, locked map[entity.ProjectID]bool, ids []entity.ProjectID) error {
	slices.Sort(ids)
	for _, id := range slices.Compact(ids) {
		if locked[id] {
			continue
		}
		if _, err := e.projects.GetForUpdate(ctx, id); err != nil {
			return err
		}
		locked[id] = true
	}
	return nil
}

// edit is a change of a task by a member of its project: in a transaction under the project lock
// (and the also projects) it applies apply and writes the task.
func (e *editor) edit(ctx context.Context, userID, taskID string, also []entity.ProjectID,
	apply func(ctx context.Context, task *entity.Task, now time.Time) error,
) (*entity.Task, error) {
	var task *entity.Task
	f := func(ctx context.Context) error {
		t, _, err := e.lock(ctx, taskID, userID, also...)
		if err != nil {
			return err
		}
		if err := apply(ctx, t, e.clock.Now()); err != nil {
			return err
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

// assignee returns assigneeID's membership in the project; nil means no assignee. A non-member gives
// ASSIGNEE_NOT_MEMBER: an error in the request data, not a missing resource.
func (e *editor) assignee(ctx context.Context, projectID entity.ProjectID, assigneeID *string) (*entity.ProjectMember, error) {
	if assigneeID == nil {
		return nil, nil
	}
	member, err := e.members.Get(ctx, projectID, entity.UserID(*assigneeID))
	if domain.HasCode(err, domain.EntityNotFound) {
		return nil, domain.ErrAssigneeNotMember("projectID", projectID, "assigneeID", *assigneeID)
	}
	return member, err
}
