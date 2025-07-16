package repo

import (
	"context"
	"errors"
	"fmt"
	"task-trail/internal/usecase/dto"
)

var ErrNotFound = errors.New("entity not found")
var ErrConflict = errors.New("entity already exists")
var ErrInternal = errors.New("something went wrong")

func Wrap(err error, background error) error {
	return fmt.Errorf("%w, error: %w", err, background)
}

type TxManager interface {
	DoWithTx(ctx context.Context, fn func(ctx context.Context) error) error
}

type UserRepository interface {
	Create(ctx context.Context, dto *dto.UserCreate) (int, error)
	EmailIsTaken(ctx context.Context, email string) (bool, error)
	GetByEmail(ctx context.Context, email string) (*dto.User, error)
	GetByID(ctx context.Context, ID int) (*dto.User, error)
	// Update: Updates user fields based on the provided UserUpdate DTO. The DTO must include the user's ID;
	// other fields are optional and only those provided will be updated.
	Update(ctx context.Context, dto *dto.UserUpdate) error
	GetIdsByEmails(ctx context.Context, emails []string) ([]*dto.UserEmailAndID, error)
}
type VerificationRepository interface {
	Create(ctx context.Context, userID int, code int) error
	Verify(ctx context.Context, code int) error
}

type RefreshTokenRepository interface {
	Create(ctx context.Context, data *dto.RefreshTokenCreate) error
	GetByID(ctx context.Context, tokenID string, userID int) (*dto.RefreshToken, error)
	Revoke(ctx context.Context, tokenID string) error
	RevokeAllUsersTokens(ctx context.Context, userID int) (int, error)
	DeleteRevokedAndOldTokens(ctx context.Context, olderThan int) (int, error)
}

type EmailTokenRepository interface {
	GetByID(ctx context.Context, tokenID string) (*dto.EmailToken, error)
	Create(ctx context.Context, data *dto.EmailTokenCreate) error
	Use(ctx context.Context, tokenID string) error
	DeleteUsedAndOldTokens(ctx context.Context, olderThan int) (int, error)
}

type NotificationRepository interface {
	SendVerificationEmail(ctx context.Context, email string, token string) error
	SendResetPasswordEmail(ctx context.Context, email string, token string) error
	SendAutoRegisterEmail(ctx context.Context, email string) error
	SendInvintationInProject(ctx context.Context, data *dto.NotificationProjectInvite) error
}

type FileRepository interface {
	Create(ctx context.Context, file *dto.FileCreate) error
}

// ProjectRepository defines methods for managing projects and their members.
type ProjectRepository interface {
	// Create attempts to create a new project and returns the project ID on success, or an error if something goes wrong.
	Create(ctx context.Context, data *dto.ProjectCreate) (int, error)

	// GetList retrieves a list of projects based on the provided filter criteria.
	GetList(ctx context.Context, data *dto.ProjectList) ([]*dto.ProjectRes, error)

	GetByID(ctx context.Context, projectID int) (*dto.ProjectRes, error)
	// GetOwned fetches a project by its ID and owner ID.
	GetOwned(ctx context.Context, projectID int, ownerID int) (*dto.Project, error)

	// GetCandidates returns a list of users who can be added to a porject.
	// If projectID is 0, returns all candidates for the owner;
	// otherwise, excludes users already in the specified project.
	GetCandidates(ctx context.Context, ownerID int, projectID int) ([]*dto.UserSimple, error)

	// AddMembers adds new members to a project.
	AddMembers(ctx context.Context, data *dto.ProjectAddMembersDB) error

	// IsMember checks if a user is a member of the specified project.
	// Returns repo.ErrNotFound if the user is not a member, nil if the user is a member,
	// or another repo error if a query error occurs.
	IsMember(ctx context.Context, projectID int, memberID int) error
}
