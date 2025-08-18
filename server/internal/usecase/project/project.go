package project

import (
	"context"
	"errors"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase"
)

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
	if err := u.projectRepo.VerifyMembership(ctx, projectID, memberID); err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return u.errHandler.NotFound(
				err,
				"project or user not found",
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

// func (u *UseCase) GetUserRole(ctx context.Context, projectID int, userID int) error {

// }

func (u *UseCase) VerifyAccess(ctx context.Context, projectID int, userID int, permisssion string) error {
	res, err := u.projectRepo.HasPermission(ctx, projectID, userID, permisssion)
	if err != nil {
		return u.errHandler.InternalTrouble(
			err, "failed to verify user access",
			"projectID", projectID,
			"userID", userID,
			"permission", permisssion,
		)
	}
	if !res {
		return u.errHandler.Forbidden(
			nil, "user dont have required permission",
			"projectID", projectID,
			"userID", userID,
			"permission", permisssion)
	}
	return nil
}
