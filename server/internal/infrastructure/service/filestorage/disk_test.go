package filestorage_test

import (
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"task-trail/internal/infrastructure/service/filestorage"
)

var _ service.FileStorage = (*filestorage.Disk)(nil)

const fileID = entity.FileID("0b8f8a52-9c2e-4d5f-8a1b-3c4d5e6f7a8b")

func TestDisk(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "files", "nested")
	if err := filestorage.Prepare(dir); err != nil {
		t.Fatal(err)
	}
	disk := filestorage.NewDisk(dir)
	ctx := context.Background()

	if err := disk.Save(ctx, fileID, strings.NewReader("содержимое")); err != nil {
		t.Fatal(err)
	}
	// A file never changes by ID: there is no second write under the same ID
	if err := disk.Save(ctx, fileID, strings.NewReader("другое")); err == nil {
		t.Fatal("file overwritten")
	}
	content, size, err := disk.Open(ctx, fileID)
	if err != nil {
		t.Fatal(err)
	}
	data, err := io.ReadAll(content)
	_ = content.Close()
	if err != nil || string(data) != "содержимое" || size != int64(len("содержимое")) {
		t.Fatalf("read %q, %d bytes, %v", data, size, err)
	}

	// List does not see foreign files in the folder, so cleanup will not touch them either
	if err := os.WriteFile(filepath.Join(dir, "notes.txt"), []byte("x"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(dir, "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e"), 0o700); err != nil {
		t.Fatal(err)
	}
	stored, err := disk.List(ctx)
	if err != nil || len(stored) != 1 || stored[0].ID != fileID || stored[0].ModifiedAt.IsZero() {
		t.Fatalf("in storage: %+v, %v", stored, err)
	}

	if err := disk.Delete(ctx, fileID); err != nil {
		t.Fatal(err)
	}
	if err := disk.Delete(ctx, fileID); err != nil {
		t.Fatalf("repeated delete: %v", err)
	}
	if _, _, err := disk.Open(ctx, fileID); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("after delete: %v", err)
	}
}

// The path is built only from a UUID: neither ".." nor "/" can get into it (ADR-0013).
func TestDiskRejectsNonUUID(t *testing.T) {
	dir := t.TempDir()
	if err := filestorage.Prepare(filepath.Join(dir, "files")); err != nil {
		t.Fatal(err)
	}
	disk := filestorage.NewDisk(filepath.Join(dir, "files"))
	ctx := context.Background()
	for _, id := range []entity.FileID{"../escape", "../../etc/passwd", "", "0b8f8a529c2e4d5f8a1b3c4d5e6f7a8b"} {
		if err := disk.Save(ctx, id, strings.NewReader("x")); err == nil {
			t.Errorf("%q: written", id)
		}
		if _, _, err := disk.Open(ctx, id); err == nil {
			t.Errorf("%q: opened", id)
		}
		if err := disk.Delete(ctx, id); err == nil {
			t.Errorf("%q: deleted", id)
		}
	}
	if _, err := os.Stat(filepath.Join(dir, "escape")); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("file outside the folder: %v", err)
	}
}

type failingReader struct{}

func (failingReader) Read([]byte) (int, error) {
	return 0, errors.New("connection dropped")
}

// A write that did not finish leaves no partial file.
func TestDiskSaveFailure(t *testing.T) {
	disk := filestorage.NewDisk(t.TempDir())
	ctx := context.Background()
	if err := disk.Save(ctx, fileID, io.MultiReader(strings.NewReader("начало"), failingReader{})); err == nil {
		t.Fatal("the read error did not propagate")
	}
	if stored, err := disk.List(ctx); err != nil || len(stored) != 0 {
		t.Fatalf("a file remained: %+v, %v", stored, err)
	}
}
