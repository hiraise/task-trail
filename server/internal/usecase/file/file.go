package file

import (
	"context"
	"errors"
	"task-trail/internal/customerrors"
	"task-trail/internal/pkg/storage"
	"task-trail/internal/pkg/uuid"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

type UseCase struct {
	txManager  repo.TxManager
	fileRepo   repo.FileRepository
	storage    storage.Service
	errHandler customerrors.ErrorHandler
	uuidGen    uuid.Generator
}

func New(
	txManager repo.TxManager,
	fileRepo repo.FileRepository,
	storage storage.Service,
	errHandler customerrors.ErrorHandler,
	uuidGen uuid.Generator,
) *UseCase {
	return &UseCase{
		txManager:  txManager,
		fileRepo:   fileRepo,
		storage:    storage,
		errHandler: errHandler,
		uuidGen:    uuidGen,
	}
}

func (u *UseCase) Save(
	ctx context.Context,
	data *dto.FileUpload,
) (string, error) {
	name := u.uuidGen.Generate()
	// register in db
	f := &dto.FileCreate{
		ID:           name,
		OriginalName: data.File.Name,
		MimeType:     data.File.MimeType,
		OwnerID:      data.UserID,
	}
	err := u.fileRepo.Create(ctx, f)
	if err != nil {
		if errors.Is(err, repo.ErrConflict) {
			return "", u.errHandler.Conflict(err, "file already exists")
		}
		if errors.Is(err, repo.ErrNotFound) {
			return "", u.errHandler.NotFound(err, "owner not found")
		}
		return "", u.errHandler.InternalTrouble(err, "failed to upload file")
	}
	// change filename for saving in storage as unique name
	data.File.Name = name
	// save in storage
	if err := u.storage.Save(ctx, data.File); err != nil {
		return "", u.errHandler.InternalTrouble(err, "file storing failure")
	}
	return name, nil

}
