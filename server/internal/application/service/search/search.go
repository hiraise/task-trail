// Package search holds search across projects, boards and tasks (ADR-0030): a substring match
// among what the user can see anyway.
package search

import (
	"context"
	"regexp"
	"strconv"
	"strings"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

// limit — at most this many results per group (ADR-0030).
const limit = 20

type SearchModule struct {
	Search *SearchService
}

// Deps are the dependencies of the search module.
type Deps struct {
	ProjectRepo repository.ProjectRepository
	BoardRepo   repository.BoardRepository
	TaskRepo    repository.TaskRepository
}

func New(d Deps) *SearchModule {
	return &SearchModule{Search: &SearchService{projects: d.ProjectRepo, boards: d.BoardRepo, tasks: d.TaskRepo}}
}

// SearchService finds projects, boards and tasks of the user by a substring.
type SearchService struct {
	projects repository.ProjectRepository
	boards   repository.BoardRepository
	tasks    repository.TaskRepository
}

// Execute searches for q; the handler has checked that q is 1–100 characters after trimming.
func (s *SearchService) Execute(ctx context.Context, userID, q string) (*dto.SearchResult, error) {
	q = strings.TrimSpace(q)
	viewer, pattern := entity.UserID(userID), substring(q)
	projects, err := s.projects.Search(ctx, viewer, pattern, limit)
	if err != nil {
		return nil, err
	}
	boards, err := s.boards.Search(ctx, viewer, pattern, limit)
	if err != nil {
		return nil, err
	}
	tasks, err := s.tasks.Search(ctx, viewer, pattern, taskKey(q), limit)
	if err != nil {
		return nil, err
	}
	return &dto.SearchResult{Projects: projects, Boards: boards, Tasks: tasks}, nil
}

// likeEscaper escapes the ILIKE special characters: % and _ in q are matched as characters.
var likeEscaper = strings.NewReplacer(`\`, `\\`, "%", `\%`, "_", `\_`)

// substring is an ILIKE pattern (ESCAPE '\') that matches values containing q.
func substring(q string) string {
	return "%" + likeEscaper.Replace(q) + "%"
}

// taskKeyPattern — a task key: a project key (ADR-0026) in any case, a hyphen and a number.
var taskKeyPattern = regexp.MustCompile(`^(\p{L}[\p{L}0-9]{1,9})-(\d+)$`)

// taskKey recognizes a task key in q; nil — q is not a key. A number beyond the INT column
// cannot be a task number.
func taskKey(q string) *repository.TaskKeyQuery {
	m := taskKeyPattern.FindStringSubmatch(q)
	if m == nil {
		return nil
	}
	number, err := strconv.ParseInt(m[2], 10, 32)
	if err != nil {
		return nil
	}
	return &repository.TaskKeyQuery{Key: entity.ProjectKey(strings.ToUpper(m[1])), Number: int(number)}
}
