package project

import (
	"context"
	"errors"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase"
)

const AdminRoleName = "admin"
const OwnerRoleName = "owner"
const MemberRoleName = "member"
const PROJECT_INVITE_USERS string = "PROJECT_INVITE_USERS"
const PROJECT_KICK_USERS string = "PROJECT_KICK_USERS"
const PROJECT_SET_ROLES string = "PROJECT_SET_ROLES"
const PROJECT_EDIT string = "PROJECT_EDIT"
const PROJECT_ARCHIVE string = "PROJECT_ARCHIVE"
const PROJECT_DELETE string = "PROJECT_DELETE"

type UseCase struct {
	txManager        repo.TxManager
	authUC           usecase.Authentication
	projectRepo      repo.ProjectRepository
	userRepo         repo.UserRepository
	notificationRepo repo.NotificationRepository
	errHandler       customerrors.ErrorHandler
}

func New(
	txManager repo.TxManager,
	authUC usecase.Authentication,
	projectRepo repo.ProjectRepository,
	userRepo repo.UserRepository,
	notificationRepo repo.NotificationRepository,
	errHandler customerrors.ErrorHandler,
) *UseCase {
	return &UseCase{

		txManager:        txManager,
		authUC:           authUC,
		projectRepo:      projectRepo,
		userRepo:         userRepo,
		notificationRepo: notificationRepo,
		errHandler:       errHandler,
	}
}

func (u *UseCase) CheckMembership(ctx context.Context, projectID int, memberID int) error {
	if err := u.projectRepo.IsMember(ctx, projectID, memberID); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return u.errHandler.NotFound(
				err,
				"project not found",
				"memberID", memberID,
				"projectID", projectID,
			)
		}
		return u.errHandler.InternalTrouble(
			err,
			"failed to verify user membership",
			"memberID", memberID,
			"projectID", projectID,
		)
	}
	return nil
}
