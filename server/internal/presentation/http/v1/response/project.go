package response

import (
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/repository"
)

// Project is a project in a list (Project in the contract).
type Project struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	Key         string  `json:"key"`
	// ArchivedAt — when the project was archived, or null (ADR-0027)
	ArchivedAt *time.Time `json:"archivedAt"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
	TasksCount int        `json:"tasksCount"`
}

// ProjectDetails is a project and the current user's role in it.
type ProjectDetails struct {
	Project
	Role string `json:"role"`
}

func NewProject(v *repository.ProjectView) Project {
	p := v.Project
	// Time is in UTC (ADR-0018): the database returns it in the server's time zone
	return Project{
		ID:          string(p.ID),
		Name:        p.Name,
		Description: p.Description,
		Key:         string(p.Key),
		ArchivedAt:  utc(p.ArchivedAt),
		CreatedAt:   p.CreatedAt.UTC(),
		UpdatedAt:   p.UpdatedAt.UTC(),
		TasksCount:  v.TasksCount,
	}
}

func NewProjectDetails(v *repository.ProjectView) ProjectDetails {
	return ProjectDetails{Project: NewProject(v), Role: string(v.Role)}
}

func NewProjects(views []*repository.ProjectView) []Project {
	out := make([]Project, len(views))
	for i, v := range views {
		out[i] = NewProject(v)
	}
	return out
}

// InvitationResult is what happened to an email invited to the project.
type InvitationResult struct {
	Email     string  `json:"email"`
	Result    string  `json:"result"`
	InviteURL *string `json:"inviteUrl"`
}

func NewInvitationResults(results []dto.InvitationResult) []InvitationResult {
	out := make([]InvitationResult, len(results))
	for i, r := range results {
		out[i] = InvitationResult{Email: string(r.Email), Result: string(r.Outcome), InviteURL: r.InviteURL}
	}
	return out
}

// ProjectCreated is the created project and the result for each email in the request.
type ProjectCreated struct {
	Project     ProjectDetails     `json:"project"`
	Invitations []InvitationResult `json:"invitations"`
}

// Member is a project member: the user and their role.
type Member struct {
	User
	Role string `json:"role"`
}

func NewMember(v *repository.MemberView) Member {
	return Member{User: NewUser(v.User), Role: string(v.Member.Role)}
}

func NewMembers(views []*repository.MemberView) []Member {
	out := make([]Member, len(views))
	for i, v := range views {
		out[i] = NewMember(v)
	}
	return out
}
