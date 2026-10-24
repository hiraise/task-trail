package task_test

import (
	"context"
	"errors"
	"io"
	"testing"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/test/txtest"

	"go.uber.org/mock/gomock"
)

// A failed transaction erases the file already written to disk (ADR-0013, ADR-0037).
func TestUploadAttachmentTxFailed(t *testing.T) {
	failure := errors.New("database unavailable")
	module, d := newModule(t)
	d.tasks.EXPECT().Get(txtest.OutsideTx, taskID).Return(stored(designID, nil), nil)
	d.members.EXPECT().Get(txtest.OutsideTx, designID, userID).Return(member(designID, userID), nil)
	var saved entity.FileID
	d.storage.EXPECT().Save(txtest.OutsideTx, gomock.Any(), gomock.Any()).DoAndReturn(
		func(_ context.Context, id entity.FileID, _ io.Reader) error { saved = id; return nil })
	txtest.Expect(d.tx)
	d.tasks.EXPECT().Get(txtest.InTx, taskID).Return(stored(designID, nil), nil).Times(2)
	d.projects.EXPECT().GetForUpdate(txtest.InTx, designID).Return(project(designID), nil)
	d.members.EXPECT().Get(txtest.InTx, designID, userID).Return(member(designID, userID), nil)
	d.files.EXPECT().Create(txtest.InTx, gomock.Any()).Return(nil)
	d.attachments.EXPECT().Create(txtest.InTx, gomock.Any()).Return(failure)
	d.storage.EXPECT().Delete(txtest.OutsideTx, gomock.Any()).DoAndReturn(func(_ context.Context, id entity.FileID) error {
		if id != saved {
			t.Errorf("erased %s, written %s", id, saved)
		}
		return nil
	})
	upload := dto.Upload{Name: "notes.txt", Content: []byte("hello")}
	if _, err := module.UploadAttachment.Execute(context.Background(), string(userID), string(taskID), upload); !errors.Is(err, failure) {
		t.Fatalf("error %v", err)
	}
}

// A too large upload touches neither the storage nor the database: strict mocks fail on any call.
func TestUploadAttachmentTooLarge(t *testing.T) {
	module, _ := newModule(t)
	upload := dto.Upload{Name: "big.bin", Content: make([]byte, entity.MaxAttachmentSize+1)}
	_, err := module.UploadAttachment.Execute(context.Background(), string(userID), string(taskID), upload)
	if !domain.HasCode(err, domain.FileTooLarge) {
		t.Fatalf("error %v, want %s", err, domain.FileTooLarge)
	}
}

// A non-member learns nothing, and nothing is written to disk.
func TestUploadAttachmentNotMember(t *testing.T) {
	module, d := newModule(t)
	d.tasks.EXPECT().Get(txtest.OutsideTx, taskID).Return(stored(designID, nil), nil)
	d.members.EXPECT().Get(txtest.OutsideTx, designID, userID).Return(nil, notFound())
	upload := dto.Upload{Name: "notes.txt", Content: []byte("hello")}
	_, err := module.UploadAttachment.Execute(context.Background(), string(userID), string(taskID), upload)
	if !domain.HasCode(err, domain.EntityNotFound) {
		t.Fatalf("error %v", err)
	}
}
