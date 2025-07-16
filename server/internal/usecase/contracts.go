package usecase

import (
	"context"
	"task-trail/internal/usecase/dto"
)

// Authentication defines the contract for user authentication and authorization use cases.
// It provides methods for user login, registration, logout, token refresh, email verification,
// resending verification emails, sending password reset emails, and resetting passwords.
//
// Implementations of this interface should handle the necessary business logic for each operation,
// including token management and email communications.
type Authentication interface {
	Login(ctx context.Context, data *dto.Credentials) (*dto.LoginRes, error)
	Register(ctx context.Context, data *dto.Credentials) error
	AutoRegister(ctx context.Context, email string) error
	Logout(ctx context.Context, refreshToken string) error
	Refresh(ctx context.Context, refreshToken string) (*dto.RefreshRes, error)
	Verify(ctx context.Context, tokenID string) error
	ResendVerificationEmail(ctx context.Context, email string) error
	SendPasswordResetEmail(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, data *dto.PasswordReset) error
	ChangePassword(ctx context.Context, data *dto.PasswordChange) error
}

// User defines the contract for user-related operations in the application.
// It provides methods for updating a user's avatar, updating user information by ID,
// and retrieving a user by their ID.
type User interface {
	UpdateAvatar(ctx context.Context, data *dto.FileUpload) (*dto.UserAvatar, error)
	UpdateByID(ctx context.Context, data *dto.UserUpdate) (*dto.CurrentUser, error)
	GetCurrentByID(ctx context.Context, ID int) (*dto.CurrentUser, error)
}

// File defines the contract for file storage operations.
// It provides a method to save a file with associated metadata such as owner ID, filename, and MIME type.
// The Save method returns the identifier of the uploaded file, or an error if the operation fails.
type File interface {
	Save(ctx context.Context, data *dto.FileUpload) (string, error)
}

type Project interface {
	Create(ctx context.Context, data *dto.ProjectCreate) (int, error)
	GetList(ctx context.Context, data *dto.ProjectList) ([]*dto.ProjectRes, error)
	GetByID(ctx context.Context, projectID int, memberID int) (*dto.ProjectRes, error)
	AddMembers(ctx context.Context, data *dto.ProjectAddMembers) error
	GetCandidates(ctx context.Context, ownerID int, projectID int) ([]*dto.UserSimple, error)
}
