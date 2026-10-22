// Package filestorage stores files in a folder on the server's disk — FILES_DIR (ADR-0013).
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

// Disk stores each file under its ID as the name, without subfolders.
type Disk struct {
	dir string
}

// NewDisk is a storage in folder dir. Prepare creates the folder at server startup.
func NewDisk(dir string) *Disk {
	return &Disk{dir: dir}
}

// Prepare creates the files folder if it is missing: an inaccessible FILES_DIR shows up right at
// server startup, not at the first upload.
func Prepare(dir string) error {
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return fmt.Errorf("files folder FILES_DIR=%q: %w", dir, err)
	}
	return nil
}

// path builds the path only from an ID in UUID form: neither ".." nor "/" can get into it.
func (d *Disk) path(id entity.FileID) (string, error) {
	if !isUUID(string(id)) {
		return "", fmt.Errorf("file ID is not a UUID: %q", id)
	}
	return filepath.Join(d.dir, string(id)), nil
}

func isUUID(s string) bool {
	return len(s) == 36 && uuid.Validate(s) == nil
}

// Save writes straight under the final name: the database record appears only after the file
// is written, and a file without a record is never served and is erased by cleanup after a day.
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

// List returns only files with a UUID name: if FILES_DIR points to a non-empty folder,
// cleanup will not touch foreign files.
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
			// The file was erased while the folder was being read
			continue
		}
		if err != nil {
			return nil, err
		}
		files = append(files, service.StoredFile{ID: entity.FileID(entry.Name()), ModifiedAt: info.ModTime()})
	}
	return files, nil
}
