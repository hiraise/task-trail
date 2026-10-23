package dto

type CreateBoard struct {
	Name       string
	ProjectIDs []string
	// MemberIDs are whom to add right away besides the owner, as in AddBoardMembers.
	MemberIDs []string
}
