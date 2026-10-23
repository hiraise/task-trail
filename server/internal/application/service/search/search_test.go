package search

import (
	"context"
	"testing"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/test/mocks"

	"go.uber.org/mock/gomock"
)

func TestTaskKey(t *testing.T) {
	tests := []struct {
		q    string
		want *repository.TaskKeyQuery
	}{
		{"DS-12", &repository.TaskKeyQuery{Key: "DS", Number: 12}},
		{"ds-12", &repository.TaskKeyQuery{Key: "DS", Number: 12}},
		{"дз2-7", &repository.TaskKeyQuery{Key: "ДЗ2", Number: 7}},
		{"D-1", nil},
		{"2D-1", nil},
		{"ABCDEFGHIJK-1", nil},
		{"DS-", nil},
		{"DS 12", nil},
		{"DS-12a", nil},
		{"DS-99999999999", nil},
	}
	for _, tt := range tests {
		got := taskKey(tt.q)
		if (got == nil) != (tt.want == nil) || got != nil && *got != *tt.want {
			t.Errorf("taskKey(%q) = %+v, want %+v", tt.q, got, tt.want)
		}
	}
}

func TestSubstring(t *testing.T) {
	for q, want := range map[string]string{"альф": "%альф%", "50%": `%50\%%`, "a_b": `%a\_b%`, `a\b`: `%a\\b%`} {
		if got := substring(q); got != want {
			t.Errorf("substring(%q) = %q, want %q", q, got, want)
		}
	}
}

// Execute trims q and passes the same pattern to every group; a key goes only to tasks.
func TestExecute(t *testing.T) {
	ctrl := gomock.NewController(t)
	projects, boards, tasks := mocks.NewMockProjectRepository(ctrl), mocks.NewMockBoardRepository(ctrl), mocks.NewMockTaskRepository(ctrl)
	ctx := context.Background()
	viewer := entity.UserID("user")
	projects.EXPECT().Search(ctx, viewer, "%ds-1%", limit).Return([]*repository.ProjectView{}, nil)
	boards.EXPECT().Search(ctx, viewer, "%ds-1%", limit).Return([]*repository.BoardView{}, nil)
	tasks.EXPECT().Search(ctx, viewer, "%ds-1%", &repository.TaskKeyQuery{Key: "DS", Number: 1}, limit).Return([]*entity.Task{}, nil)

	s := New(Deps{ProjectRepo: projects, BoardRepo: boards, TaskRepo: tasks}).Search
	if _, err := s.Execute(ctx, "user", "  ds-1 "); err != nil {
		t.Fatal(err)
	}
}
