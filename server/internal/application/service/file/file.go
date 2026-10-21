// Package file — выдача файлов и очистка хранилища (ADR-0013).
package file

import (
	"context"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

type FileModule struct {
	Download *DownloadService
	Cleanup  *CleanupService
}

// Deps — зависимости модуля файлов. OrphanAge — через сколько стирать файл на диске,
// у которого нет записи в базе: раньше он может оказаться загрузкой, которая ещё идёт.
type Deps struct {
	Clock       service.Clock
	FileRepo    repository.FileRepository
	FileStorage service.FileStorage
	OrphanAge   time.Duration
}

func New(d Deps) *FileModule {
	return &FileModule{
		Download: &DownloadService{fileRepository: d.FileRepo, storage: d.FileStorage},
		Cleanup: &CleanupService{
			clock:          d.Clock,
			fileRepository: d.FileRepo,
			storage:        d.FileStorage,
			orphanAge:      d.OrphanAge,
		},
	}
}

// DownloadService отдаёт файл по ID. Сейчас все файлы — аватарки, их отдают без входа:
// ID случайный, а <img> не умеет обновить сессию (ADR-0013). Вложения (этап 3) — только
// участникам их проекта: появятся они — проверяй здесь участие.
type DownloadService struct {
	fileRepository repository.FileRepository
	storage        service.FileStorage
}

func (s *DownloadService) Execute(ctx context.Context, id string) (dto.FileContent, error) {
	file, err := s.fileRepository.Get(ctx, entity.FileID(id))
	if err != nil {
		return dto.FileContent{}, err
	}
	content, size, err := s.storage.Open(ctx, file.ID)
	if err != nil {
		return dto.FileContent{}, err
	}
	return dto.FileContent{File: file, Content: content, Size: size}, nil
}

// CleanupService стирает с диска ненужные файлы и отмечает это в базе, а заодно — файлы
// без записи в базе старше OrphanAge: их оставила прерванная загрузка (ADR-0013).
type CleanupService struct {
	clock          service.Clock
	fileRepository repository.FileRepository
	storage        service.FileStorage
	orphanAge      time.Duration
}

// Execute возвращает, сколько файлов стёрто.
func (s *CleanupService) Execute(ctx context.Context) (int64, error) {
	now := s.clock.Now()
	var erased int64
	unneeded, err := s.fileRepository.ListSoftDeleted(ctx)
	if err != nil {
		return erased, err
	}
	for _, id := range unneeded {
		if err := s.storage.Delete(ctx, id); err != nil {
			return erased, err
		}
		if err := s.fileRepository.MarkErased(ctx, id, now); err != nil {
			return erased, err
		}
		erased++
	}

	stored, err := s.storage.List(ctx)
	if err != nil {
		return erased, err
	}
	var old []entity.FileID
	for _, f := range stored {
		if now.Sub(f.ModifiedAt) >= s.orphanAge {
			old = append(old, f.ID)
		}
	}
	known, err := s.fileRepository.Known(ctx, old)
	if err != nil {
		return erased, err
	}
	for _, id := range old {
		if known[id] {
			continue
		}
		if err := s.storage.Delete(ctx, id); err != nil {
			return erased, err
		}
		erased++
	}
	return erased, nil
}
