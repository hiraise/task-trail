package user

import (
	"bytes"
	"context"
	"net/http"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// UploadAvatarService replaces the current user's avatar. The previous one is marked as deleted,
// cleanup erases it from disk (ADR-0013).
type UploadAvatarService struct {
	txManager      transaction.TxManager
	clock          service.Clock
	userRepository repository.UserRepository
	fileRepository repository.FileRepository
	fileFactory    *factory.FileFactory
	storage        service.FileStorage
}

func (s *UploadAvatarService) Execute(ctx context.Context, userID string, upload dto.Upload) (*entity.UserAccount, error) {
	// The type comes from the content, not from the request header (ADR-0013)
	mimeType := http.DetectContentType(upload.Content)
	if err := entity.CheckAvatar(int64(len(upload.Content)), mimeType); err != nil {
		return nil, err
	}
	file := s.fileFactory.New(upload.Name, mimeType, entity.UserID(userID), int64(len(upload.Content)))
	// The file is written before the transaction: a slow disk does not hold the user row lock
	if err := s.storage.Save(ctx, file.ID, bytes.NewReader(upload.Content)); err != nil {
		return nil, err
	}
	var user *entity.UserAccount
	f := func(ctx context.Context) error {
		u, err := s.userRepository.GetForUpdate(ctx, entity.UserID(userID))
		if err != nil {
			return sessionUser(err, userID)
		}
		if err := s.fileRepository.Create(ctx, file); err != nil {
			return err
		}
		now := s.clock.Now()
		previous := u.ReplaceAvatar(file.ID, now)
		if err := s.userRepository.Update(ctx, u); err != nil {
			return err
		}
		if previous != nil {
			if err := s.fileRepository.SoftDelete(ctx, *previous, now); err != nil {
				return err
			}
		}
		user = u
		return nil
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		// The transaction failed: nobody needs the file (ADR-0013). If it is not erased now,
		// cleanup erases it in a day as a file without a database record.
		_ = s.storage.Delete(ctx, file.ID)
		return nil, err
	}
	return user, nil
}
