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
var ErrValidation = errors.New("input data is invalid")

func Wrap(err error, background error) error {
	return fmt.Errorf("%w, error: %w", err, background)
}

type TxManager interface {
	DoWithTx(ctx context.Context, fn func(ctx context.Context) error) error
}

type UserRepository interface {
	Create(ctx context.Context, dto *dto.UserCreate) (int, error)
	CreateBulk(ctx context.Context, data []*dto.UserCreate) ([]*dto.UserEmailAndID, error)
	EmailIsTaken(ctx context.Context, email string) (bool, error)
	GetByEmail(ctx context.Context, email string) (*dto.User, error)
	GetByID(ctx context.Context, ID int) (*dto.User, error)
	// Update: Updates user fields based on the provided UserUpdate DTO. The DTO must include the user's ID;
	// other fields are optional and only those provided will be updated.
	Update(ctx context.Context, dto *dto.UserUpdate) error
	GetIdsByEmails(ctx context.Context, emails []string) ([]*dto.UserEmailAndID, error)
	Delete(ctx context.Context, userID int) error
	GetTasks(ctx context.Context, userID int) ([]*dto.TaskListRes, error)
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

// ProjectRepository defines methods for managing projects, their members and roles.
type ProjectRepository interface {
	// Create attempts to create a new project.
	//
	// It returns the project ID on success, or an error if something goes wrong.
	Create(ctx context.Context, name string, description string) (int, error)

	// GetList retrieves a list of projects based on the provided filter criteria.
	//
	// It returns an error if something goes wrong.
	GetList(ctx context.Context, data *dto.ProjectList) ([]*dto.ProjectListRes, error)

	// GetByID return a project by id.
	//
	// It returns error if project not found or if something goes wrong.
	GetByID(ctx context.Context, projectID int) (*dto.ProjectListRes, error)

	// Update change project information according passed data and projectID
	//
	// It returns error if the input data is invalid or if the operation fails.
	Update(ctx context.Context, projectID int, data *dto.ProjectUpdate) error

	// Delete deletes an project by ID.
	//
	// Returns an error if the operation fails.
	Delete(ctx context.Context, projectID int) error

	// AddMembers adds multiple members to projects with associated roles.
	//
	// This function must be called within a transaction to ensure data consistency.
	// It returns an error if called outside of a transaction, if the operation fails,
	// or if the number of added members does not match the input slice length.
	AddMembers(ctx context.Context, data []*dto.ProjectAddMembersDB) error

	// GetCandidates returns a list of users from projects where user (userID) has passed permission.
	//
	// If projectID is 0, returns all candidates;
	// otherwise, excludes users already in the specified project.
	GetCandidates(ctx context.Context, userID int, permission string, projectID int) ([]*dto.UserSimple, error)

	// VerifyMembership checks if a user is a member of the specified project.
	//
	// It returns an error if the user is not a member, nil if the user is a member,
	// or another repo error if the operation fails.
	VerifyMembership(ctx context.Context, projectID int, memberID int) error

	// GetMembers returns a slice of project members.
	//
	// It excludes users that are deleted, belong to deleted projects, or have deleted roles.
	// It returns an error if the operation fails or if the result parsing fails.
	GetMembers(ctx context.Context, projectID int) ([]*dto.ProjectMember, error)

	// CreateRoles creates roles for the specified project.
	//
	// It returns the created roles as a slice of ProjectRoleRes DTOs,
	// or an error if the operation fails or the result parsing fails.
	CreateRoles(ctx context.Context, projectID int, roles []string) ([]*dto.ProjectRoleRes, error)

	// GetProjectRoles retrieves the roles associated with a given project.
	//
	// The function filters out projects and roles that have been soft-deleted.
	// It returns a slice of ProjectRoleRes DTOs or an error if the operation fails if the result parsing fails.
	GetProjectRoles(ctx context.Context, projectID int) ([]*dto.ProjectRoleRes, error)

	// GetMemberRights retrieves the roles and associated permissions for a specific member within a given project.
	//
	// It returns a slice of user permissions.
	// The function queries the database to find all roles assigned to the member in the specified project,
	// along with the permissions granted by those roles. If the project is deleted or an error occurs during
	// the operation, an error is returned.
	GetMemberRights(ctx context.Context, projectID int, memberID int) ([]string, error)

	// AppendPermissions adds the specified permissions to a project role.
	//
	// It returns an error if any of the permissions are not found in the database or if the operation fails.
	AppendPermissions(ctx context.Context, roleID int, permissions []string) error

	// HasPermission checks whether the specified member has the given permission for a project.
	//
	// Returns true if the permission exists, false if not, or an error if the operation fails.
	HasPermission(ctx context.Context, projectID int, memberID int, permission string) (bool, error)

	// DeleteRoles deletes project roles by IDs.
	//
	// This function must be called within a transaction to ensure data consistency.
	// It returns an error if called outside of a transaction, if the operation fails,
	// or if the number of delete roles does not match the input slice length.
	DeleteRoles(ctx context.Context, roleIDs []int) error

	RemoveMembership(ctx context.Context, projectID int, userID int) error

	// GetTaskStatuses return list of task status of passed project
	GetTaskStatuses(ctx context.Context, projectID int) ([]*dto.ProjectStatus, error)
	CreateStatuses(ctx context.Context, projectID int, data []*dto.ProjectStatusCreate) error

	GetTasks(ctx context.Context, projectID int) ([]*dto.TaskListRes, error)
	DeleteTasks(ctx context.Context, projectID int) error
}

type TaskRepository interface {
	Create(ctx context.Context, data *dto.TaskCreate) (int, error)
	GetByID(ctx context.Context, taskID int) (*dto.TaskListRes, error)
}
