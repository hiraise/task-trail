// Package filestorage хранит файлы в папке на диске сервера — FILES_DIR (ADR-0013).
package filestorage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"

	"github.com/google/uuid"
)

// Disk хранит каждый файл под именем — его ID, без вложенных папок.
type Disk struct {
	dir string
}

// NewDisk — хранилище в папке dir. Папку создаёт Prepare при запуске сервера.
func NewDisk(dir string) *Disk {
	return &Disk{dir: dir}
}

// Prepare создаёт папку файлов, если её нет: недоступная FILES_DIR видна сразу при запуске
// сервера, а не при первой загрузке.
func Prepare(dir string) error {
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return fmt.Errorf("папка файлов FILES_DIR=%q: %w", dir, err)
	}
	return nil
}

// path строит путь только из ID в виде UUID: ни «..», ни «/» в него не попадут.
func (d *Disk) path(id entity.FileID) (string, error) {
	if !isUUID(string(id)) {
		return "", fmt.Errorf("ID файла не UUID: %q", id)
	}
	return filepath.Join(d.dir, string(id)), nil
}

func isUUID(s string) bool {
	return len(s) == 36 && uuid.Validate(s) == nil
}

// Save пишет прямо под окончательным именем: запись в базе появляется только после записи
// файла, а файл без записи не отдаётся и через сутки стирается очисткой.
func (d *Disk) Save(_ context.Context, id entity.FileID, content io.Reader) (err error) {
	path, err := d.path(id)
	if err != nil {
		return err
	}
	f, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o640)
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := f.Close(); err == nil {
			err = closeErr
		}
		if err != nil {
			_ = os.Remove(path)
		}
	}()
	if _, err := io.Copy(f, content); err != nil {
		return err
	}
	return f.Sync()
}

func (d *Disk) Open(_ context.Context, id entity.FileID) (io.ReadCloser, int64, error) {
	path, err := d.path(id)
	if err != nil {
		return nil, 0, err
	}
	f, err := os.Open(path)
	if err != nil {
		return nil, 0, err
	}
	info, err := f.Stat()
	if err != nil {
		_ = f.Close()
		return nil, 0, err
	}
	return f, info.Size(), nil
}

func (d *Disk) Delete(_ context.Context, id entity.FileID) error {
	path, err := d.path(id)
	if err != nil {
		return err
	}
	if err := os.Remove(path); err != nil && !errors.Is(err, fs.ErrNotExist) {
		return err
	}
	return nil
}

// List возвращает только файлы с именем-UUID: чужие файлы, если FILES_DIR указали
// на непустую папку, очистка не тронет.
func (d *Disk) List(_ context.Context) ([]service.StoredFile, error) {
	entries, err := os.ReadDir(d.dir)
	if err != nil {
		return nil, err
	}
	var files []service.StoredFile
	for _, entry := range entries {
		if !entry.Type().IsRegular() || !isUUID(entry.Name()) {
			continue
		}
		info, err := entry.Info()
		if errors.Is(err, fs.ErrNotExist) {
			// Файл стёрли, пока читали папку
			continue
		}
		if err != nil {
			return nil, err
		}
		files = append(files, service.StoredFile{ID: entity.FileID(entry.Name()), ModifiedAt: info.ModTime()})
	}
	return files, nil
}
