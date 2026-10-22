package entity_test

import (
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
)

var taskTime = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

// Статусы — в порядке работы над задачей; новая задача — «Открыта», выполненная — «Готово»
// (контракт, TaskStatus).
func TestTaskStatuses(t *testing.T) {
	var got []string
	for _, s := range entity.TaskStatuses() {
		got = append(got, string(s.ID)+" "+s.Name)
		if s.IsDefault != (s.ID == entity.StatusOpen) || s.IsResolved != (s.ID == entity.StatusDone) {
			t.Errorf("признаки статуса %s: %+v", s.ID, s)
		}
		if !s.ID.Valid() {
			t.Errorf("%s не из набора", s.ID)
		}
	}
	want := []string{"open Открыта", "in_progress В работе", "in_review На проверке", "done Готово"}
	if len(got) != len(want) {
		t.Fatalf("статусы: %v", got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("статусы: %v", got)
		}
	}
	for _, s := range []entity.TaskStatus{"", "closed", "OPEN"} {
		if s.Valid() {
			t.Errorf("%q — не статус", s)
		}
	}
	entity.TaskStatuses()[0].Name = "испорчено"
	if entity.TaskStatuses()[0].Name != "Открыта" {
		t.Error("список статусов меняется снаружи")
	}
}

// Исполнитель — только участник проекта задачи; nil снимает исполнителя.
func TestTaskAssignTo(t *testing.T) {
	ivan := &entity.ProjectMember{ProjectID: "design", UserID: "ivan", Role: entity.RoleMember}
	task, err := entity.NewTask("task", "design", "anna", "Кнопка", nil, ivan, taskTime)
	if err != nil {
		t.Fatal(err)
	}
	if task.Status != entity.StatusOpen || task.AuthorID != "anna" || task.AssigneeID == nil || *task.AssigneeID != "ivan" ||
		!task.CreatedAt.Equal(taskTime) || !task.UpdatedAt.Equal(taskTime) {
		t.Fatalf("новая задача: %+v", task)
	}

	elsewhere := &entity.ProjectMember{ProjectID: "backend", UserID: "petr"}
	later := taskTime.Add(time.Hour)
	if err := task.AssignTo(elsewhere, later); !domain.HasCode(err, domain.AssigneeNotMember) {
		t.Fatalf("исполнитель из другого проекта: %v", err)
	}
	if *task.AssigneeID != "ivan" || !task.UpdatedAt.Equal(taskTime) {
		t.Fatalf("после отказа задача изменилась: %+v", task)
	}
	if err := task.AssignTo(nil, later); err != nil || task.AssigneeID != nil || !task.UpdatedAt.Equal(later) {
		t.Fatalf("снять исполнителя: %+v, %v", task, err)
	}
	if _, err := entity.NewTask("task", "design", "anna", "Кнопка", nil, elsewhere, taskTime); !domain.HasCode(err, domain.AssigneeNotMember) {
		t.Fatalf("новая задача с чужим исполнителем: %v", err)
	}
}

// Перенос сохраняет статус; исполнитель остаётся, только если он участник нового проекта.
func TestTaskMoveTo(t *testing.T) {
	ivan := entity.UserID("ivan")
	for name, c := range map[string]struct {
		assignee *entity.ProjectMember
		stays    bool
	}{
		"участник нового проекта":    {&entity.ProjectMember{ProjectID: "backend", UserID: ivan}, true},
		"не участник нового проекта": {nil, false},
		"участие в другом проекте":   {&entity.ProjectMember{ProjectID: "design", UserID: ivan}, false},
		"участие другого человека":   {&entity.ProjectMember{ProjectID: "backend", UserID: "petr"}, false},
	} {
		task := &entity.Task{ID: "task", ProjectID: "design", Status: entity.StatusInReview, AssigneeID: &ivan, UpdatedAt: taskTime}
		task.MoveTo("backend", c.assignee, taskTime.Add(time.Hour))
		if task.ProjectID != "backend" || task.Status != entity.StatusInReview || !task.UpdatedAt.Equal(taskTime.Add(time.Hour)) ||
			(task.AssigneeID != nil) != c.stays {
			t.Errorf("%s: %+v", name, task)
		}
	}
	task := &entity.Task{ID: "task", ProjectID: "design"}
	task.MoveTo("backend", &entity.ProjectMember{ProjectID: "backend", UserID: ivan}, taskTime)
	if task.AssigneeID != nil {
		t.Errorf("задача без исполнителя получила исполнителя: %+v", task)
	}
}
