package task_test

import (
	"context"
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
	// ID проектов упорядочены: backend < design — от этого зависит порядок блокировок
	backendID = entity.ProjectID("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d")
	designID  = entity.ProjectID("5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e")
)

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

type deps struct {
	tx       *mocks.MockTxManager
	projects *mocks.MockProjectRepository
	members  *mocks.MockProjectMemberRepository
	tasks    *mocks.MockTaskRepository
}

func newModule(t *testing.T) (*task.TaskModule, *deps) {
	ctrl := gomock.NewController(t)
	d := &deps{
		tx:       mocks.NewMockTxManager(ctrl),
		projects: mocks.NewMockProjectRepository(ctrl),
		members:  mocks.NewMockProjectMemberRepository(ctrl),
		tasks:    mocks.NewMockTaskRepository(ctrl),
	}
	clk := clock.New(now)
	return task.New(task.Deps{
		TxManager:   d.tx,
		Clock:       clk,
		ProjectRepo: d.projects,
		MemberRepo:  d.members,
		TaskRepo:    d.tasks,
		TaskFactory: factory.NewTaskFactory(id.New(), clk),
	}), d
}

func notFound() error { return domain.ErrEntityNotFound(0, nil) }

func member(projectID entity.ProjectID, userID entity.UserID) *entity.ProjectMember {
	return &entity.ProjectMember{ProjectID: projectID, UserID: userID, Role: entity.RoleMember}
}

// stored — задача в проекте projectID, какой её вернёт репозиторий.
func stored(projectID entity.ProjectID, assignee *entity.UserID) *entity.Task {
	return &entity.Task{
		ID: taskID, ProjectID: projectID, Name: "Кнопка", Status: entity.StatusInReview,
		AuthorID: userID, AssigneeID: assignee, CreatedAt: now.Add(-time.Hour), UpdatedAt: now.Add(-time.Hour),
	}
}

func project(id entity.ProjectID) *entity.Project { return &entity.Project{ID: id} }

// Задача меняется под блокировкой своего проекта: сначала блокировка, затем задача читается
// заново, и только потом — проверка участия и запись.
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
				t.Errorf("записана задача %+v", got)
			}
			return nil
		}),
	)
	got, err := module.ChangeStatus.Execute(context.Background(), string(userID), string(taskID), entity.StatusDone)
	if err != nil || got.Status != entity.StatusDone {
		t.Fatalf("%+v, %v", got, err)
	}
}

// Задачу перенесли, пока ждали блокировку: блокируется и её новый проект, права —
// по новому проекту.
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
		t.Fatalf("не участник нового проекта: %v", err)
	}
}

// Перенос блокирует оба проекта по возрастанию ID; исполнитель не участник нового проекта —
// задача остаётся без исполнителя, статус прежний.
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
		d.tasks.EXPECT().Update(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, got *entity.Task) error {
			if got.ProjectID != backendID || got.AssigneeID != nil || got.Status != entity.StatusInReview {
				t.Errorf("записана задача %+v", got)
			}
			return nil
		}),
	)
	if _, err := module.Move.Execute(context.Background(), string(userID), string(taskID), string(backendID)); err != nil {
		t.Fatal(err)
	}
}

// Переносит только участник обоих проектов: в чужой проект — 404, задача не меняется.
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
		t.Fatalf("перенос в чужой проект: %v", err)
	}
}

// Задачу создаёт участник проекта под блокировкой проекта: статус — open, автор — он сам.
func TestCreateTask(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	ivan := string(ivanID)
	gomock.InOrder(
		d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil),
		d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil),
		d.members.EXPECT().Get(txtest.InTx, designID, ivanID).Return(member(designID, ivanID), nil),
		d.tasks.EXPECT().Create(txtest.InTx, gomock.Any()).Return(nil),
	)
	description := "Основная кнопка"
	got, err := module.Create.Execute(context.Background(), string(userID),
		dto.CreateTask{ProjectID: string(designID), Name: "Кнопка", Description: &description, AssigneeID: &ivan})
	if err != nil {
		t.Fatal(err)
	}
	if got.ID == "" || got.ProjectID != designID || got.Name != "Кнопка" || *got.Description != description ||
		got.Status != entity.StatusOpen || got.AuthorID != userID || *got.AssigneeID != ivanID ||
		!got.CreatedAt.Equal(now) || !got.UpdatedAt.Equal(now) {
		t.Fatalf("задача: %+v", got)
	}
}

// Исполнитель не участник проекта — ASSIGNEE_NOT_MEMBER, задача не создаётся и не меняется.
func TestAssigneeNotMember(t *testing.T) {
	ivan := string(ivanID)
	t.Run("создание", func(t *testing.T) {
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
	t.Run("смена исполнителя", func(t *testing.T) {
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

// Не участник проекта не видит задачу: 404, как будто её нет.
func TestGetTaskNotMember(t *testing.T) {
	module, d := newModule(t)
	d.tasks.EXPECT().Get(txtest.OutsideTx, taskID).Return(stored(designID, nil), nil)
	d.members.EXPECT().Get(txtest.OutsideTx, designID, userID).Return(nil, notFound())
	if _, err := module.Get.Execute(context.Background(), string(userID), string(taskID)); !domain.HasCode(err, domain.EntityNotFound) {
		t.Fatalf("%v", err)
	}
}
