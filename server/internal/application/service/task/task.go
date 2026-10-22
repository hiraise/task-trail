// Package task — сценарии задач: каждое изменение — своя операция (ADR-0002), статусы
// фиксированы (ADR-0003), удаление мягкое (ADR-0001). Задачу видит и меняет любой участник
// её проекта; не участнику — ENTITY_NOT_FOUND: существование задачи не выдаём (ADR-0018).
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

// Deps — зависимости модуля задач.
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

// editor меняет задачи под блокировкой их проекта (TaskRepository).
type editor struct {
	txManager transaction.TxManager
	clock     service.Clock
	projects  repository.ProjectRepository
	members   repository.ProjectMemberRepository
	tasks     repository.TaskRepository
}

// lock блокирует до конца транзакции проект задачи и проекты also и находит задачу
// и участие userID в её проекте.
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
		// Пока ждали блокировку, задачу могли перенести или удалить. Теперь, если её проект
		// заблокирован, задача не изменится до конца транзакции
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

// lockProjects блокирует проекты ids, кроме уже заблокированных, по возрастанию ID: так
// два встречных переноса задач не ждут друг друга.
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

// edit — изменение задачи участником её проекта: в транзакции под блокировкой проекта
// (и проектов also) применяет apply и записывает задачу.
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

// assignee — участие assigneeID в проекте; nil — без исполнителя. Не участник —
// ASSIGNEE_NOT_MEMBER: ошибка в данных запроса, а не ресурс, которого нет.
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
