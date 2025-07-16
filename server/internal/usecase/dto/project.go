package dto

import "time"

type Project struct {
	ID          int
	Name        string
	Description string
	OwnerID     int
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
	MemberIDs []int
	ProjectID int
}

type ProjectAddMembers struct {
	MemberEmails []string
	ProjectID    int
	OwnerID      int
}

// response

type ProjectRes struct {
	ID          int
	Name        string
	Description string
	CreatedAt   time.Time
	TaskCount   int
}
