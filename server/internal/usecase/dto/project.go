package dto

import (
	"time"
)

type Project struct {
	ID          int
	Name        string
	Description string
	CreatedAt   time.Time
	Members     []*UserEmailAndID
}

type ProjectCreate struct {
	Name        string
	Description string
	OwnerID     int
}

type ProjectList struct {
	MemberID   int
	IsArchived bool
}

type ProjectAddMembersDB struct {
	MemberID  int
	ProjectID int
	RoleID    int
}

type ProjectAddMembers struct {
	MemberEmails []string
	ProjectID    int
	OwnerID      int
}

type ProjectRoleCreate struct {
	Name        string
	Permissions []string
}
type ProjectUpdate struct {
	Name        string
	Description string
}

// response

type ProjectListRes struct {
	ID          int
	Name        string
	Description string
	CreatedAt   time.Time
	TaskCount   int
}

type ProjectRes struct {
	ID          int
	Name        string
	Description string
	CreatedAt   time.Time
	TaskCount   int
	Rights      []*ProjectRights
}
type ProjectRoleRes struct {
	ID   int
	Name string
}

type ProjectMember struct {
	ID       int
	Email    string
	Username *string
	Role     string
}

type ProjectRights struct {
	Role        string
	Permissions []string
}
