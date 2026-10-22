package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// FileRepository хранит записи о файлах (ADR-0013). Жизнь файла: загружен → не нужен
// (soft_deleted_at, файл уже не отдаётся) → стёрт с диска очисткой (deleted_at).
type FileRepository interface {
	Create(ctx context.Context, file *entity.File) error
	// Get находит файл, который ещё нужен: помеченный удалённым не находится.
	Get(ctx context.Context, id entity.FileID) (*entity.File, error)
	// SoftDelete отмечает, что файл больше не нужен, например заменённая аватарка.
	SoftDelete(ctx context.Context, id entity.FileID, now time.Time) error
	// ListSoftDeleted — ненужные файлы, которые ещё не стёрты с диска.
	ListSoftDeleted(ctx context.Context) ([]entity.FileID, error)
	// MarkErased отмечает, что файл стёрт с диска.
	MarkErased(ctx context.Context, id entity.FileID, now time.Time) error
	// Known возвращает те из ids, у которых есть запись и файл ещё не стёрт: файлы на диске
	// без такой записи — мусор от прерванной загрузки.
	Known(ctx context.Context, ids []entity.FileID) (map[entity.FileID]bool, error)
}
