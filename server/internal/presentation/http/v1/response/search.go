package response

import "task-trail/internal/application/dto"

// SearchResult — SearchResult in the contract: the groups in the shapes of their lists (ADR-0030).
type SearchResult struct {
	Projects []Project `json:"projects"`
	Boards   []Board   `json:"boards"`
	Tasks    []Task    `json:"tasks"`
}

func NewSearchResult(r *dto.SearchResult) SearchResult {
	return SearchResult{Projects: NewProjects(r.Projects), Boards: NewBoards(r.Boards), Tasks: NewTasks(r.Tasks)}
}
