package response

import (
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/repository"
)

// Project — проект в списке (Project в контракте).
type Project struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	TasksCount  int       `json:"tasksCount"`
}

// ProjectDetails — проект и роль текущего пользователя в нём.
type ProjectDetails struct {
	Project
	Role string `json:"role"`
}

func NewProject(v *repository.ProjectView) Project {
	p := v.Project
	// Время — в UTC (ADR-0018): из базы оно приходит в поясе сервера
	return Project{ID: string(p.ID), Name: p.Name, Description: p.Description, CreatedAt: p.CreatedAt.UTC(), TasksCount: v.TasksCount}
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

// InvitationResult — что стало с почтой, которую позвали в проект.
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

// ProjectCreated — созданный проект и результат по почтам из запроса.
type ProjectCreated struct {
	Project     ProjectDetails     `json:"project"`
	Invitations []InvitationResult `json:"invitations"`
}

// Member — участник проекта: пользователь и его роль.
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
