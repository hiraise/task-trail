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

type deps struct {
	files       *mocks.MockFileRepository
	storage     *mocks.MockFileStorage
	attachments *mocks.MockAttachmentRepository
	tasks       *mocks.MockTaskRepository
	members     *mocks.MockProjectMemberRepository
}

func newModule(t *testing.T) (*file.FileModule, *deps) {
	ctrl := gomock.NewController(t)
	d := &deps{
		files:       mocks.NewMockFileRepository(ctrl),
		storage:     mocks.NewMockFileStorage(ctrl),
		attachments: mocks.NewMockAttachmentRepository(ctrl),
		tasks:       mocks.NewMockTaskRepository(ctrl),
		members:     mocks.NewMockProjectMemberRepository(ctrl),
	}
	return file.New(file.Deps{
		Clock: clock.New(now), FileRepo: d.files, FileStorage: d.storage, OrphanAge: orphanAge,
		AttachmentRepo: d.attachments, TaskRepo: d.tasks, MemberRepo: d.members,
	}), d
}

// Unneeded files are erased and marked in the database; files without a record only if older than OrphanAge.
func TestCleanup(t *testing.T) {
	module, d := newModule(t)
	files, storage := d.files, d.storage
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
			t.Errorf("checked %v", ids)
		}
		return map[entity.FileID]bool{"avatar": true}, nil
	})
	storage.EXPECT().Delete(gomock.Any(), entity.FileID("orphan")).Return(nil)
	storage.EXPECT().Delete(gomock.Any(), entity.FileID("exactly-a-day")).Return(nil)

	erased, err := module.Cleanup.Execute(context.Background())
	if err != nil || erased != 4 {
		t.Fatalf("erased %d, %v", erased, err)
	}
}

// The file was not erased: it stays unneeded in the database, and the next cleanup tries again.
func TestCleanupStopsOnDiskError(t *testing.T) {
	module, d := newModule(t)
	files, storage := d.files, d.storage
	failure := errors.New("read-only disk")
	files.EXPECT().ListSoftDeleted(gomock.Any()).Return([]entity.FileID{"replaced"}, nil)
	storage.EXPECT().Delete(gomock.Any(), entity.FileID("replaced")).Return(failure)
	if _, err := module.Cleanup.Execute(context.Background()); !errors.Is(err, failure) {
		t.Fatalf("error %v", err)
	}
}

func TestDownload(t *testing.T) {
	module, d := newModule(t)
	files, storage := d.files, d.storage
	stored := &entity.File{ID: "avatar", MimeType: "image/png"}
	d.attachments.EXPECT().TaskOf(gomock.Any(), entity.FileID("avatar")).Return(nil, nil)
	files.EXPECT().Get(gomock.Any(), entity.FileID("avatar")).Return(stored, nil)
	storage.EXPECT().Open(gomock.Any(), entity.FileID("avatar")).Return(io.NopCloser(strings.NewReader("png")), int64(3), nil)
	// An avatar is served to a guest
	content, err := module.Download.Execute(context.Background(), "", "avatar")
	if err != nil || content.File != stored || content.Size != 3 {
		t.Fatalf("%+v, %v", content, err)
	}

	d.attachments.EXPECT().TaskOf(gomock.Any(), entity.FileID("replaced")).Return(nil, nil)
	files.EXPECT().Get(gomock.Any(), entity.FileID("replaced")).Return(nil, domain.ErrEntityNotFound(0, nil))
	if _, err := module.Download.Execute(context.Background(), "", "replaced"); !domain.HasCode(err, domain.EntityNotFound) {
		t.Fatalf("error %v", err)
	}
}

// An attachment is served only to members of its task's project (ADR-0037).
func TestDownloadAttachment(t *testing.T) {
	const (
		fileID    = entity.FileID("notes")
		taskID    = entity.TaskID("task")
		projectID = entity.ProjectID("project")
		memberID  = entity.UserID("member")
		strangeID = entity.UserID("stranger")
	)
	expectTask := func(d *deps) {
		id := taskID
		d.attachments.EXPECT().TaskOf(gomock.Any(), fileID).Return(&id, nil)
	}

	t.Run("guest", func(t *testing.T) {
		module, d := newModule(t)
		expectTask(d)
		_, err := module.Download.Execute(context.Background(), "", string(fileID))
		if !domain.HasCode(err, domain.AccessTokenNotFound) {
			t.Fatalf("error %v", err)
		}
	})
	t.Run("not a member", func(t *testing.T) {
		module, d := newModule(t)
		expectTask(d)
		d.tasks.EXPECT().Get(gomock.Any(), taskID).Return(&entity.Task{ID: taskID, ProjectID: projectID}, nil)
		d.members.EXPECT().Get(gomock.Any(), projectID, strangeID).Return(nil, domain.ErrEntityNotFound(0, nil))
		_, err := module.Download.Execute(context.Background(), string(strangeID), string(fileID))
		if !domain.HasCode(err, domain.EntityNotFound) {
			t.Fatalf("error %v", err)
		}
	})
	t.Run("member", func(t *testing.T) {
		module, d := newModule(t)
		expectTask(d)
		d.tasks.EXPECT().Get(gomock.Any(), taskID).Return(&entity.Task{ID: taskID, ProjectID: projectID}, nil)
		d.members.EXPECT().Get(gomock.Any(), projectID, memberID).Return(&entity.ProjectMember{ProjectID: projectID, UserID: memberID}, nil)
		stored := &entity.File{ID: fileID, MimeType: "text/plain; charset=utf-8"}
		d.files.EXPECT().Get(gomock.Any(), fileID).Return(stored, nil)
		d.storage.EXPECT().Open(gomock.Any(), fileID).Return(io.NopCloser(strings.NewReader("hello")), int64(5), nil)
		content, err := module.Download.Execute(context.Background(), string(memberID), string(fileID))
		if err != nil || content.File != stored || content.Size != 5 {
			t.Fatalf("%+v, %v", content, err)
		}
	})
}
