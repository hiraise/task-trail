package task_test

import (
	"context"
	"reflect"
	"testing"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/service/task"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/test/clock"
	"task-trail/test/mocks"
	"task-trail/test/txtest"

	"go.uber.org/mock/gomock"
)

const (
	userID = entity.UserID("0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c")
	ivanID = entity.UserID("9d8c7b6a-5e4f-4d3c-8b2a-1f0e9d8c7b6a")
	taskID = entity.TaskID("7e6d5c4b-3a29-4817-a6f5-e4d3c2b1a098")
	// Project IDs are ordered: backend < design, the lock order depends on it
	backendID = entity.ProjectID("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d")
	designID  = entity.ProjectID("5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e")
)

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

type deps struct {
	tx       *mocks.MockTxManager
	projects *mocks.MockProjectRepository
	members  *mocks.MockProjectMemberRepository
	tasks    *mocks.MockTaskRepository
	events   *mocks.MockTaskEventRepository
	labels   *mocks.MockLabelRepository
}

func newModule(t *testing.T) (*task.TaskModule, *deps) {
	ctrl := gomock.NewController(t)
	d := &deps{
		tx:       mocks.NewMockTxManager(ctrl),
		projects: mocks.NewMockProjectRepository(ctrl),
		members:  mocks.NewMockProjectMemberRepository(ctrl),
		tasks:    mocks.NewMockTaskRepository(ctrl),
		events:   mocks.NewMockTaskEventRepository(ctrl),
		labels:   mocks.NewMockLabelRepository(ctrl),
	}
	clk := clock.New(now)
	return task.New(task.Deps{
		TxManager:    d.tx,
		Clock:        clk,
		ProjectRepo:  d.projects,
		MemberRepo:   d.members,
		TaskRepo:     d.tasks,
		TaskFactory:  factory.NewTaskFactory(id.New(), clk),
		EventRepo:    d.events,
		EventFactory: factory.NewTaskEventFactory(id.New()),
		LabelRepo:    d.labels,
	}), d
}

// expectEvents expects the history rows written in a transaction, in order, and returns them.
func (d *deps) expectEvents(n int) *[]*entity.TaskEvent {
	var got []*entity.TaskEvent
	if n == 0 {
		return &got
	}
	d.events.EXPECT().Create(txtest.InTx, gomock.Any()).Times(n).DoAndReturn(func(_ context.Context, e *entity.TaskEvent) error {
		got = append(got, e)
		return nil
	})
	return &got
}

func notFound() error { return domain.ErrEntityNotFound(0, nil) }

func member(projectID entity.ProjectID, userID entity.UserID) *entity.ProjectMember {
	return &entity.ProjectMember{ProjectID: projectID, UserID: userID, Role: entity.RoleMember}
}

// stored is a task in project projectID as the repository returns it.
func stored(projectID entity.ProjectID, assignee *entity.UserID) *entity.Task {
	return &entity.Task{
		ID: taskID, ProjectID: projectID, ProjectKey: project(projectID).Key, Number: 12, Name: "Кнопка", Status: entity.StatusInReview,
		Priority: entity.PriorityNormal,
		AuthorID: userID, AssigneeID: assignee, CreatedAt: now.Add(-time.Hour), UpdatedAt: now.Add(-time.Hour),
	}
}

func project(id entity.ProjectID) *entity.Project {
	return &entity.Project{ID: id, Key: map[entity.ProjectID]entity.ProjectKey{backendID: "BE", designID: "DS"}[id]}
}

// A task changes under its project's lock: first the lock, then the task is read
// again, and only then the membership check and the write.
func TestEditLocksTaskProject(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	gomock.InOrder(
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil),
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil),
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil),
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil),
		d.tasks.EXPECT().Update(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, got *entity.Task) error {
			if got.Status != entity.StatusDone || !got.UpdatedAt.Equal(now) || got.ProjectID != designID {
				t.Errorf("task written %+v", got)
			}
			return nil
		}),
	)
	events := d.expectEvents(1)
	got, err := module.ChangeStatus.Execute(context.Background(), string(userID), string(taskID), entity.StatusDone)
	if err != nil || got.Status != entity.StatusDone {
		t.Fatalf("%+v, %v", got, err)
	}
	if e := (*events)[0]; e.Kind != entity.EventStatusChanged || *e.FromStatus != entity.StatusInReview || *e.ToStatus != entity.StatusDone ||
		e.ActorID != userID || e.TaskID != taskID || !e.CreatedAt.Equal(now) {
		t.Errorf("event %+v", e)
	}
}

// A priority change writes priority_changed; the same value writes no event (ADR-0033).
func TestChangePriority(t *testing.T) {
	for name, c := range map[string]struct {
		to     entity.TaskPriority
		events int
	}{
		"another priority": {entity.PriorityUrgent, 1},
		"the same":         {entity.PriorityNormal, 0},
	} {
		t.Run(name, func(t *testing.T) {
			module, d := newModule(t)
			txtest.Expect(d.tx)
			d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil).Times(2)
			d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil)
			d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
			d.tasks.EXPECT().Update(txtest.InTx, gomock.Any()).Return(nil)
			events := d.expectEvents(c.events)
			got, err := module.ChangePriority.Execute(context.Background(), string(userID), string(taskID), c.to)
			if err != nil || got.Priority != c.to {
				t.Fatalf("%+v, %v", got, err)
			}
			if c.events == 0 {
				if !got.UpdatedAt.Equal(now.Add(-time.Hour)) {
					t.Errorf("the same priority changed updatedAt: %v", got.UpdatedAt)
				}
				return
			}
			if !got.UpdatedAt.Equal(now) {
				t.Errorf("updatedAt %v", got.UpdatedAt)
			}
			if e := (*events)[0]; e.Kind != entity.EventPriorityChanged || *e.FromPriority != entity.PriorityNormal || *e.ToPriority != entity.PriorityUrgent ||
				e.ActorID != userID || e.TaskID != taskID || !e.CreatedAt.Equal(now) {
				t.Errorf("event %+v", e)
			}
		})
	}
}

// A due date change writes due_date_changed with YYYY-MM-DD; nil removes the date; the same day
// writes no event (ADR-0034).
func TestChangeDueDate(t *testing.T) {
	oct30 := entity.NewDueDate(2026, time.October, 30)
	nov2 := entity.NewDueDate(2026, time.November, 2)
	str := func(s string) *string { return &s }
	for name, c := range map[string]struct {
		from, to *time.Time
		event    *entity.TaskEvent
	}{
		"set":        {nil, &oct30, &entity.TaskEvent{FromDueDate: nil, ToDueDate: str("2026-10-30")}},
		"change":     {&oct30, &nov2, &entity.TaskEvent{FromDueDate: str("2026-10-30"), ToDueDate: str("2026-11-02")}},
		"remove":     {&nov2, nil, &entity.TaskEvent{FromDueDate: str("2026-11-02"), ToDueDate: nil}},
		"the same":   {&oct30, new(entity.NewDueDate(2026, time.October, 30)), nil},
		"none again": {nil, nil, nil},
	} {
		t.Run(name, func(t *testing.T) {
			module, d := newModule(t)
			txtest.Expect(d.tx)
			task := stored(designID, nil)
			task.DueDate = c.from
			d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(task, nil).Times(2)
			d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil)
			d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
			d.tasks.EXPECT().Update(txtest.InTx, gomock.Any()).Return(nil)
			count := 0
			if c.event != nil {
				count = 1
			}
			events := d.expectEvents(count)
			got, err := module.ChangeDueDate.Execute(context.Background(), string(userID), string(taskID), c.to)
			if err != nil || !entity.SameDueDate(got.DueDate, c.to) {
				t.Fatalf("%+v, %v", got, err)
			}
			if c.event == nil {
				if !got.UpdatedAt.Equal(now.Add(-time.Hour)) {
					t.Errorf("the same due date changed updatedAt: %v", got.UpdatedAt)
				}
				return
			}
			if !got.UpdatedAt.Equal(now) {
				t.Errorf("updatedAt %v", got.UpdatedAt)
			}
			e := (*events)[0]
			if e.Kind != entity.EventDueDateChanged || !reflect.DeepEqual(e.FromDueDate, c.event.FromDueDate) ||
				!reflect.DeepEqual(e.ToDueDate, c.event.ToDueDate) || e.ActorID != userID || e.TaskID != taskID || !e.CreatedAt.Equal(now) {
				t.Errorf("event %+v", e)
			}
		})
	}
}

// The task was moved while waiting for the lock: its new project is locked too, rights are checked
// against the new project.
func TestLockFollowsMovedTask(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	gomock.InOrder(
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil),
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil),
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(backendID, nil), nil),
		d.projects.EXPECT().GetForUpdate(txtest.InTx, backendID).Return(project(backendID), nil),
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(backendID, nil), nil),
		d.members.EXPECT().Get(txtest.InTx, backendID, userID).Return(nil, notFound()),
	)
	err := module.Delete.Execute(context.Background(), string(userID), string(taskID))
	if !domain.HasCode(err, domain.EntityNotFound) {
		t.Fatalf("not a member of the new project: %v", err)
	}
}

// A move locks both projects in ascending ID order; the task gets the next number of the new project and
// its key; if the assignee is not a member of the new project, the task is left without an assignee,
// the status stays the same.
func TestMoveTask(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	ivan := ivanID
	gomock.InOrder(
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, &ivan), nil),
		d.projects.EXPECT().GetForUpdate(txtest.InTx, backendID).Return(project(backendID), nil),
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil),
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, &ivan), nil),
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil),
		d.members.EXPECT().Get(txtest.InTx, backendID, userID).Return(member(backendID, userID), nil),
		d.members.EXPECT().Get(txtest.InTx, backendID, ivanID).Return(nil, notFound()),
		d.projects.EXPECT().NextTaskNumber(txtest.InTx, backendID).Return(4, nil),
		d.labels.EXPECT().ClearTask(txtest.InTx, taskID).Return(nil),
		d.tasks.EXPECT().Update(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, got *entity.Task) error {
			if got.ProjectID != backendID || got.Key() != "BE-4" || got.AssigneeID != nil || got.Status != entity.StatusInReview ||
				got.Labels == nil || len(got.Labels) != 0 {
				t.Errorf("task written %+v", got)
			}
			return nil
		}),
	)
	events := d.expectEvents(2)
	if _, err := module.Move.Execute(context.Background(), string(userID), string(taskID), string(backendID)); err != nil {
		t.Fatal(err)
	}
	// "moved" first, then the assignee removed by the move
	moved, unassigned := (*events)[0], (*events)[1]
	if moved.Kind != entity.EventMoved || *moved.FromKey != "DS-12" || *moved.ToKey != "BE-4" {
		t.Errorf("moved: %+v", moved)
	}
	if unassigned.Kind != entity.EventAssigneeChanged || *unassigned.FromUser != ivanID || unassigned.ToUser != nil {
		t.Errorf("assignee: %+v", unassigned)
	}
}

// Labels of the task's project replace the set, ordered by name, without a history event; a label
// that is not of the task's project is LABEL_UNAVAILABLE and nothing is written (ADR-0035).
func TestSetLabels(t *testing.T) {
	ui := &entity.Label{ID: "b1", ProjectID: designID, Name: "ui"}
	bug := &entity.Label{ID: "a1", ProjectID: designID, Name: "Баг"}
	api := &entity.Label{ID: "c1", ProjectID: designID, Name: "API"}
	expectLock := func(d *deps) {
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil).Times(2)
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil)
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
	}

	t.Run("labels of the project", func(t *testing.T) {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		expectLock(d)
		ids := []entity.LabelID{"b1", "a1", "c1"}
		d.labels.EXPECT().ListByIDs(txtest.InTx, designID, ids).Return([]*entity.Label{bug, ui, api}, nil)
		d.labels.EXPECT().ReplaceForTask(txtest.InTx, taskID, ids).Return(nil)
		d.tasks.EXPECT().Update(txtest.InTx, gomock.Any()).Return(nil)
		got, err := module.SetLabels.Execute(context.Background(), string(userID), string(taskID), []string{"b1", "a1", "c1"})
		if err != nil {
			t.Fatal(err)
		}
		if len(got.Labels) != 3 || got.Labels[0].Name != "API" || got.Labels[1].Name != "ui" || got.Labels[2].Name != "Баг" ||
			!got.UpdatedAt.Equal(now) {
			t.Fatalf("task %+v", got)
		}
	})

	t.Run("a label of another project", func(t *testing.T) {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		expectLock(d)
		d.labels.EXPECT().ListByIDs(txtest.InTx, designID, []entity.LabelID{"a1", "f1"}).Return([]*entity.Label{bug}, nil)
		_, err := module.SetLabels.Execute(context.Background(), string(userID), string(taskID), []string{"a1", "f1"})
		if !domain.HasCode(err, domain.LabelUnavailable) {
			t.Fatalf("err = %v", err)
		}
	})
}

// A move to the task's own project changes nothing: no new number, the task stays as it was (ADR-0026).
func TestMoveToSameProject(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil).Times(2)
	d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil)
	d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
	d.tasks.EXPECT().Update(txtest.InTx, gomock.Any()).Return(nil)
	got, err := module.Move.Execute(context.Background(), string(userID), string(taskID), string(designID))
	if err != nil || got.Key() != "DS-12" || !got.UpdatedAt.Equal(now.Add(-time.Hour)) {
		t.Fatalf("%+v, %v", got, err)
	}
}

// Only a member of both projects can move: to a foreign project it is 404, the task does not change.
func TestMoveToForeignProject(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil).Times(2)
	d.projects.EXPECT().GetForUpdate(txtest.InTx, backendID).Return(project(backendID), nil)
	d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil)
	d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
	d.members.EXPECT().Get(txtest.InTx, backendID, userID).Return(nil, notFound())
	_, err := module.Move.Execute(context.Background(), string(userID), string(taskID), string(backendID))
	if !domain.HasCode(err, domain.EntityNotFound) {
		t.Fatalf("move to a foreign project: %v", err)
	}
}

// A project member creates a task under the project lock: the number comes from the project counter,
// the status is open, the author is the member.
func TestCreateTask(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	ivan := string(ivanID)
	gomock.InOrder(
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil),
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil),
		d.members.EXPECT().Get(txtest.InTx, designID, ivanID).Return(member(designID, ivanID), nil),
		d.projects.EXPECT().NextTaskNumber(txtest.InTx, designID).Return(3, nil),
		d.tasks.EXPECT().Create(txtest.InTx, gomock.Any()).Return(nil),
	)
	events := d.expectEvents(1)
	description := "Основная кнопка"
	dueDate := entity.NewDueDate(2026, time.October, 30)
	got, err := module.Create.Execute(context.Background(), string(userID),
		dto.CreateTask{ProjectID: string(designID), Name: "Кнопка", Description: &description, AssigneeID: &ivan, Status: entity.StatusInProgress, DueDate: &dueDate})
	if err != nil {
		t.Fatal(err)
	}
	if got.ID == "" || got.ProjectID != designID || got.Number != 3 || got.Key() != "DS-3" || got.Name != "Кнопка" || *got.Description != description ||
		got.Status != entity.StatusInProgress || got.Priority != entity.PriorityNormal || got.AuthorID != userID || *got.AssigneeID != ivanID ||
		!entity.SameDueDate(got.DueDate, &dueDate) || !got.CreatedAt.Equal(now) || !got.UpdatedAt.Equal(now) {
		t.Fatalf("task: %+v", got)
	}
	if e := (*events)[0]; e.Kind != entity.EventCreated || e.TaskID != got.ID || e.ActorID != userID || !e.CreatedAt.Equal(now) {
		t.Errorf("event %+v", e)
	}
}

// The assignee is not a project member: ASSIGNEE_NOT_MEMBER, the task is neither created nor changed.
func TestAssigneeNotMember(t *testing.T) {
	ivan := string(ivanID)
	t.Run("creation", func(t *testing.T) {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil)
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
		d.members.EXPECT().Get(txtest.InTx, designID, ivanID).Return(nil, notFound())
		_, err := module.Create.Execute(context.Background(), string(userID),
			dto.CreateTask{ProjectID: string(designID), Name: "Кнопка", AssigneeID: &ivan})
		if !domain.HasCode(err, domain.AssigneeNotMember) {
			t.Fatalf("%v", err)
		}
	})
	t.Run("assignee change", func(t *testing.T) {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil).Times(2)
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil)
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
		d.members.EXPECT().Get(txtest.InTx, designID, ivanID).Return(nil, notFound())
		_, err := module.ChangeAssignee.Execute(context.Background(), string(userID), string(taskID), &ivan)
		if !domain.HasCode(err, domain.AssigneeNotMember) {
			t.Fatalf("%v", err)
		}
	})
}

// A non-member does not see the task: 404, as if it does not exist.
func TestGetTaskNotMember(t *testing.T) {
	module, d := newModule(t)
	d.tasks.EXPECT().Get(txtest.OutsideTx, taskID).Return(stored(designID, nil), nil)
	d.members.EXPECT().Get(txtest.OutsideTx, designID, userID).Return(nil, notFound())
	if _, err := module.Get.Execute(context.Background(), string(userID), string(taskID)); !domain.HasCode(err, domain.EntityNotFound) {
		t.Fatalf("%v", err)
	}
}

func archivedProject(id entity.ProjectID) *entity.Project {
	p := project(id)
	at := now.Add(-time.Minute)
	p.ArchivedAt = &at
	return p
}

func archivedTask(projectID entity.ProjectID) *entity.Task {
	t := stored(projectID, nil)
	at := now.Add(-time.Minute)
	t.ArchivedAt = &at
	return t
}

// An archived task or a task of an archived project does not change (ADR-0027): 409, nothing is written.
func TestArchivedTaskIsReadOnly(t *testing.T) {
	for name, c := range map[string]struct {
		task    *entity.Task
		project *entity.Project
		code    domain.ErrorCode
	}{
		"archived task":    {archivedTask(designID), project(designID), domain.TaskArchived},
		"archived project": {stored(designID, nil), archivedProject(designID), domain.ProjectArchived},
	} {
		t.Run(name, func(t *testing.T) {
			module, d := newModule(t)
			txtest.Expect(d.tx)
			d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(c.task, nil).Times(2)
			d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(c.project, nil)
			d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
			_, err := module.ChangeStatus.Execute(context.Background(), string(userID), string(taskID), entity.StatusDone)
			if !domain.HasCode(err, c.code) {
				t.Fatalf("%v", err)
			}
		})
	}
}

// A task is not created in an archived project and not moved into one; the target project's archive
// is checked after the membership in it.
func TestArchivedProjectTakesNoTasks(t *testing.T) {
	t.Run("creation", func(t *testing.T) {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(archivedProject(designID), nil)
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
		_, err := module.Create.Execute(context.Background(), string(userID), dto.CreateTask{ProjectID: string(designID), Name: "Кнопка"})
		if !domain.HasCode(err, domain.ProjectArchived) {
			t.Fatalf("%v", err)
		}
	})
	t.Run("move", func(t *testing.T) {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil).Times(2)
		d.projects.EXPECT().GetForUpdate(txtest.InTx, backendID).Return(archivedProject(backendID), nil)
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil)
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
		d.members.EXPECT().Get(txtest.InTx, backendID, userID).Return(member(backendID, userID), nil)
		_, err := module.Move.Execute(context.Background(), string(userID), string(taskID), string(backendID))
		if !domain.HasCode(err, domain.ProjectArchived) {
			t.Fatalf("%v", err)
		}
	})
}

// Any member archives and restores a task; the same value again keeps the update time and writes
// no event.
// In an archived project — PROJECT_ARCHIVED.
func TestSetTaskArchived(t *testing.T) {
	run := func(t *testing.T, task *entity.Task, p *entity.Project, archived bool) (*entity.Task, error) {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(task, nil).Times(2)
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(p, nil)
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
		if p.ArchivedAt == nil && (task.ArchivedAt != nil) != archived {
			d.tasks.EXPECT().Update(txtest.InTx, task).Return(nil)
			kind := map[bool]entity.TaskEventKind{true: entity.EventArchived, false: entity.EventRestored}[archived]
			d.events.EXPECT().Create(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, e *entity.TaskEvent) error {
				if e.Kind != kind || !e.CreatedAt.Equal(now) {
					t.Errorf("event %+v, want %s", e, kind)
				}
				return nil
			})
		}
		return module.SetArchived.Execute(context.Background(), string(userID), string(taskID), archived)
	}
	if got, err := run(t, stored(designID, nil), project(designID), true); err != nil || got.ArchivedAt == nil ||
		!got.ArchivedAt.Equal(now) || !got.UpdatedAt.Equal(now) {
		t.Fatalf("archive: %+v, %v", got, err)
	}
	if got, err := run(t, archivedTask(designID), project(designID), true); err != nil || !got.ArchivedAt.Equal(now.Add(-time.Minute)) ||
		!got.UpdatedAt.Equal(now.Add(-time.Hour)) {
		t.Fatalf("archive again: %+v, %v", got, err)
	}
	if got, err := run(t, archivedTask(designID), project(designID), false); err != nil || got.ArchivedAt != nil || !got.UpdatedAt.Equal(now) {
		t.Fatalf("restore: %+v, %v", got, err)
	}
	if _, err := run(t, archivedTask(designID), archivedProject(designID), false); !domain.HasCode(err, domain.ProjectArchived) {
		t.Fatalf("restore in an archived project: %v", err)
	}
}

// An archived task can be deleted, a task of an archived project cannot.
func TestDeleteArchived(t *testing.T) {
	run := func(t *testing.T, task *entity.Task, p *entity.Project) error {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(task, nil).Times(2)
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(p, nil)
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
		if p.ArchivedAt == nil {
			d.tasks.EXPECT().SoftDelete(txtest.InTx, taskID, now).Return(nil)
		}
		return module.Delete.Execute(context.Background(), string(userID), string(taskID))
	}
	if err := run(t, archivedTask(designID), project(designID)); err != nil {
		t.Fatalf("archived task: %v", err)
	}
	if err := run(t, stored(designID, nil), archivedProject(designID)); !domain.HasCode(err, domain.ProjectArchived) {
		t.Fatalf("archived project: %v", err)
	}
}
