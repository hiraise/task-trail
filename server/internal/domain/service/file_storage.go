package service

import (
	"context"
	"io"
	"time"

	"task-trail/internal/domain/entity"
)

// StoredFile — файл в хранилище и когда его записали.
type StoredFile struct {
	ID         entity.FileID
	ModifiedAt time.Time
}

// FileStorage хранит содержимое файлов под именем — ID файла (ADR-0013). Путь к файлу
// строится только из ID, а не из данных пользователя.
type FileStorage interface {
	// Save записывает файл. Не записался до конца — частичный файл удаляется.
	Save(ctx context.Context, id entity.FileID, content io.Reader) error
	// Open открывает файл на чтение и возвращает его размер.
	Open(ctx context.Context, id entity.FileID) (io.ReadCloser, int64, error)
	// Delete стирает файл; файла уже нет — не ошибка.
	Delete(ctx context.Context, id entity.FileID) error
	// List — все файлы хранилища: очистка ищет среди них файлы без записи в базе.
	List(ctx context.Context) ([]StoredFile, error)
}
