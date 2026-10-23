package entity_test

import (
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
)

var taskTime = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

// Statuses are in the order of work on a task; a new task is "open", a done one is "done"
// (contract, TaskStatus).
func TestTaskStatuses(t *testing.T) {
	var got []string
	for _, s := range entity.TaskStatuses() {
		got = append(got, string(s.ID)+" "+s.Name)
		if s.IsDefault != (s.ID == entity.StatusOpen) || s.IsResolved != (s.ID == entity.StatusDone) {
			t.Errorf("status flags %s: %+v", s.ID, s)
		}
		if !s.ID.Valid() {
			t.Errorf("%s is not in the set", s.ID)
		}
	}
	want := []string{"open Открыта", "in_progress В работе", "in_review На проверке", "done Готово"}
	if len(got) != len(want) {
		t.Fatalf("statuses: %v", got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("statuses: %v", got)
		}
	}
	for _, s := range []entity.TaskStatus{"", "closed", "OPEN"} {
		if s.Valid() {
			t.Errorf("%q is not a status", s)
		}
	}
	entity.TaskStatuses()[0].Name = "испорчено"
	if entity.TaskStatuses()[0].Name != "Открыта" {
		t.Error("the status list changes from outside")
	}
}

// A draft without a priority gives normal; the set is fixed (ADR-0033).
func TestTaskPriority(t *testing.T) {
	task, err := entity.NewTask("task", "design", "DS", 7, "anna", entity.TaskDraft{Name: "Кнопка", Status: entity.StatusOpen, Priority: entity.PriorityHigh}, nil, taskTime)
	if err != nil || task.Priority != entity.PriorityHigh {
		t.Fatalf("new task with a priority: %+v, %v", task, err)
	}
	later := taskTime.Add(time.Hour)
	task.ChangePriority(entity.PriorityUrgent, later)
	if task.Priority != entity.PriorityUrgent || !task.UpdatedAt.Equal(later) {
		t.Fatalf("change the priority: %+v", task)
	}
	for _, p := range []entity.TaskPriority{entity.PriorityLow, entity.PriorityNormal, entity.PriorityHigh, entity.PriorityUrgent} {
		if !p.Valid() {
			t.Errorf("%q is not valid", p)
		}
	}
	for _, p := range []entity.TaskPriority{"", "top", "Normal"} {
		if p.Valid() {
			t.Errorf("%q is valid", p)
		}
	}
}

// The assignee must be a member of the task's project; nil removes the assignee.
func TestTaskAssignTo(t *testing.T) {
	ivan := &entity.ProjectMember{ProjectID: "design", UserID: "ivan", Role: entity.RoleMember}
	task, err := entity.NewTask("task", "design", "DS", 7, "anna", entity.TaskDraft{Name: "Кнопка", Status: entity.StatusInProgress}, ivan, taskTime)
	if err != nil {
		t.Fatal(err)
	}
	if task.Status != entity.StatusInProgress || task.Priority != entity.PriorityNormal || task.AuthorID != "anna" || task.AssigneeID == nil || *task.AssigneeID != "ivan" ||
		task.Number != 7 || task.Key() != "DS-7" || !task.CreatedAt.Equal(taskTime) || !task.UpdatedAt.Equal(taskTime) {
		t.Fatalf("new task: %+v", task)
	}

	elsewhere := &entity.ProjectMember{ProjectID: "backend", UserID: "petr"}
	later := taskTime.Add(time.Hour)
	if err := task.AssignTo(elsewhere, later); !domain.HasCode(err, domain.AssigneeNotMember) {
		t.Fatalf("assignee from another project: %v", err)
	}
	if *task.AssigneeID != "ivan" || !task.UpdatedAt.Equal(taskTime) {
		t.Fatalf("the task changed after the refusal: %+v", task)
	}
	if err := task.AssignTo(nil, later); err != nil || task.AssigneeID != nil || !task.UpdatedAt.Equal(later) {
		t.Fatalf("remove the assignee: %+v, %v", task, err)
	}
	if _, err := entity.NewTask("task", "design", "DS", 7, "anna", entity.TaskDraft{Name: "Кнопка", Status: entity.StatusOpen}, elsewhere, taskTime); !domain.HasCode(err, domain.AssigneeNotMember) {
		t.Fatalf("new task with an outside assignee: %v", err)
	}
}

// A move keeps the status; the assignee stays only if they are a member of the new project.
func TestTaskMoveTo(t *testing.T) {
	ivan := entity.UserID("ivan")
	for name, c := range map[string]struct {
		assignee *entity.ProjectMember
		stays    bool
	}{
		"member of the new project":       {&entity.ProjectMember{ProjectID: "backend", UserID: ivan}, true},
		"not a member of the new project": {nil, false},
		"membership in another project":   {&entity.ProjectMember{ProjectID: "design", UserID: ivan}, false},
		"another person's membership":     {&entity.ProjectMember{ProjectID: "backend", UserID: "petr"}, false},
	} {
		task := &entity.Task{ID: "task", ProjectID: "design", ProjectKey: "DS", Number: 12, Status: entity.StatusInReview, AssigneeID: &ivan, UpdatedAt: taskTime}
		task.MoveTo("backend", "BE", 3, c.assignee, taskTime.Add(time.Hour))
		if task.ProjectID != "backend" || task.Key() != "BE-3" || task.Status != entity.StatusInReview || !task.UpdatedAt.Equal(taskTime.Add(time.Hour)) ||
			(task.AssigneeID != nil) != c.stays {
			t.Errorf("%s: %+v", name, task)
		}
	}
	task := &entity.Task{ID: "task", ProjectID: "design"}
	task.MoveTo("backend", "BE", 1, &entity.ProjectMember{ProjectID: "backend", UserID: ivan}, taskTime)
	if task.AssigneeID != nil {
		t.Errorf("a task without an assignee got an assignee: %+v", task)
	}
}
