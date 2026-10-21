package file_test

import (
	"context"
	"errors"
	"io"
	"slices"
	"strings"
	"testing"
	"time"

	"task-trail/internal/application/service/file"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"task-trail/test/clock"
	"task-trail/test/mocks"

	"go.uber.org/mock/gomock"
)

const orphanAge = 24 * time.Hour

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

func newModule(t *testing.T) (*file.FileModule, *mocks.MockFileRepository, *mocks.MockFileStorage) {
	ctrl := gomock.NewController(t)
	files := mocks.NewMockFileRepository(ctrl)
	storage := mocks.NewMockFileStorage(ctrl)
	return file.New(file.Deps{Clock: clock.New(now), FileRepo: files, FileStorage: storage, OrphanAge: orphanAge}), files, storage
}

// Ненужные файлы стираются и отмечаются в базе; файлы без записи — только старше OrphanAge.
func TestCleanup(t *testing.T) {
	module, files, storage := newModule(t)
	const replaced, removed = entity.FileID("replaced"), entity.FileID("removed")
	files.EXPECT().ListSoftDeleted(gomock.Any()).Return([]entity.FileID{replaced, removed}, nil)
	for _, id := range []entity.FileID{replaced, removed} {
		storage.EXPECT().Delete(gomock.Any(), id).Return(nil)
		files.EXPECT().MarkErased(gomock.Any(), id, now).Return(nil)
	}
	storage.EXPECT().List(gomock.Any()).Return([]service.StoredFile{
		{ID: "orphan", ModifiedAt: now.Add(-25 * time.Hour)},
		{ID: "exactly-a-day", ModifiedAt: now.Add(-orphanAge)},
		{ID: "uploading", ModifiedAt: now.Add(-time.Hour)},
		{ID: "avatar", ModifiedAt: now.Add(-48 * time.Hour)},
	}, nil)
	files.EXPECT().Known(gomock.Any(), gomock.Any()).DoAndReturn(func(_ context.Context, ids []entity.FileID) (map[entity.FileID]bool, error) {
		if !slices.Equal(ids, []entity.FileID{"orphan", "exactly-a-day", "avatar"}) {
			t.Errorf("проверяются %v", ids)
		}
		return map[entity.FileID]bool{"avatar": true}, nil
	})
	storage.EXPECT().Delete(gomock.Any(), entity.FileID("orphan")).Return(nil)
	storage.EXPECT().Delete(gomock.Any(), entity.FileID("exactly-a-day")).Return(nil)

	erased, err := module.Cleanup.Execute(context.Background())
	if err != nil || erased != 4 {
		t.Fatalf("стёрто %d, %v", erased, err)
	}
}

// Файл не стёрся — в базе он остаётся ненужным, и следующая очистка попробует снова.
func TestCleanupStopsOnDiskError(t *testing.T) {
	module, files, storage := newModule(t)
	failure := errors.New("диск только для чтения")
	files.EXPECT().ListSoftDeleted(gomock.Any()).Return([]entity.FileID{"replaced"}, nil)
	storage.EXPECT().Delete(gomock.Any(), entity.FileID("replaced")).Return(failure)
	if _, err := module.Cleanup.Execute(context.Background()); !errors.Is(err, failure) {
		t.Fatalf("ошибка %v", err)
	}
}

func TestDownload(t *testing.T) {
	module, files, storage := newModule(t)
	stored := &entity.File{ID: "avatar", MimeType: "image/png"}
	files.EXPECT().Get(gomock.Any(), entity.FileID("avatar")).Return(stored, nil)
	storage.EXPECT().Open(gomock.Any(), entity.FileID("avatar")).Return(io.NopCloser(strings.NewReader("png")), int64(3), nil)
	content, err := module.Download.Execute(context.Background(), "avatar")
	if err != nil || content.File != stored || content.Size != 3 {
		t.Fatalf("%+v, %v", content, err)
	}

	files.EXPECT().Get(gomock.Any(), entity.FileID("replaced")).Return(nil, domain.ErrEntityNotFound(0, nil))
	if _, err := module.Download.Execute(context.Background(), "replaced"); !domain.HasCode(err, domain.EntityNotFound) {
		t.Fatalf("ошибка %v", err)
	}
}
