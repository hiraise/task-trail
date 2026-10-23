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
	SetArchived    *SetTaskArchivedService
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
		SetArchived:    &SetTaskArchivedService{editor: e},
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

// lock locks the task's project and the also projects until the end of the transaction and finds the task,
// userID's membership in its project and the locked projects.
func (e *editor) lock(ctx context.Context, taskID, userID string, also ...entity.ProjectID) (*entity.Task, *entity.ProjectMember, map[entity.ProjectID]*entity.Project, error) {
	task, err := e.tasks.Get(ctx, entity.TaskID(taskID))
	if err != nil {
		return nil, nil, nil, err
	}
	locked := map[entity.ProjectID]*entity.Project{}
	for locked[task.ProjectID] == nil {
		if err := e.lockProjects(ctx, locked, append([]entity.ProjectID{task.ProjectID}, also...)); err != nil {
			return nil, nil, nil, err
		}
		// While waiting for the lock, the task may have been moved or deleted. Now, if its project
		// is locked, the task does not change until the end of the transaction
		if task, err = e.tasks.Get(ctx, task.ID); err != nil {
			return nil, nil, nil, err
		}
	}
	member, err := e.members.Get(ctx, task.ProjectID, entity.UserID(userID))
	if err != nil {
		return nil, nil, nil, err
	}
	return task, member, locked, nil
}

// lockProjects locks the ids projects, except those already in locked, in ascending ID order: this way
// two opposite task moves do not wait for each other. Each locked project is added to locked.
func (e *editor) lockProjects(ctx context.Context, locked map[entity.ProjectID]*entity.Project, ids []entity.ProjectID) error {
	slices.Sort(ids)
	for _, id := range slices.Compact(ids) {
		if locked[id] != nil {
			continue
		}
		project, err := e.projects.GetForUpdate(ctx, id)
		if err != nil {
			return err
		}
		locked[id] = project
	}
	return nil
}

// edit is a change of a task by a member of its project: in a transaction under the project lock
// (and the also projects) it applies apply and writes the task. apply gets the locked projects.
// The task and its project must be active (ADR-0027); an also project is checked by apply, after
// the membership in it: a non-member does not learn that it is archived.
func (e *editor) edit(ctx context.Context, userID, taskID string, also []entity.ProjectID,
	apply func(ctx context.Context, task *entity.Task, projects map[entity.ProjectID]*entity.Project, now time.Time) error,
) (*entity.Task, error) {
	var task *entity.Task
	f := func(ctx context.Context) error {
		t, _, projects, err := e.lock(ctx, taskID, userID, also...)
		if err != nil {
			return err
		}
		if err := projects[t.ProjectID].RequireActive(); err != nil {
			return err
		}
		if err := t.RequireActive(); err != nil {
			return err
		}
		if err := apply(ctx, t, projects, e.clock.Now()); err != nil {
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
