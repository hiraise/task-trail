package v1_test

import (
	"bytes"
	"context"
	"net/http"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
	"task-trail/test/apitest"
	"task-trail/test/contract"
)

type attachment struct {
	ID        string `json:"id"`
	TaskID    string `json:"taskId"`
	Name      string `json:"name"`
	MimeType  string `json:"mimeType"`
	Size      int64  `json:"size"`
	Author    user   `json:"author"`
	CreatedAt string `json:"createdAt"`
}

func attachmentFile(name string, content []byte) apitest.Multipart {
	return apitest.Multipart{{Name: "file", FileName: name, Content: content}}
}

// upload attaches a file to the task as the session's user.
func upload(t *testing.T, s *apitest.Server, taskID, name string, content []byte) attachment {
	t.Helper()
	rec := s.Do(http.MethodPost, "/v1/tasks/"+taskID+"/attachments", attachmentFile(name, content))
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[attachment](t, rec)
}

func listAttachments(t *testing.T, s *apitest.Server, taskID string) []string {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/tasks/"+taskID+"/attachments", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	var ids []string
	for _, a := range apitest.Decode[[]attachment](t, rec) {
		ids = append(ids, a.ID)
	}
	return ids
}

func requireIDs(t *testing.T, got []string, want ...string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("ids %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("ids %v, want %v", got, want)
		}
	}
}

// guest is a "browser" without a session on the same server.
func guest(t *testing.T, s *apitest.Server) *apitest.Server {
	t.Helper()
	other := *s
	anonymous(t, &other)
	return &other
}

// Any member uploads and downloads; the uploader, the owner and admins delete (ADR-0037).
func TestAttachments(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	signUp(t, s, design, "petr@example.com", "Пётр")
	login(t, s, "admin@example.com", password)
	backend := createProject(t, s, "Бэкенд").Project.ID
	signUp(t, s, backend, "olga@example.com", "Ольга")
	login(t, s, "admin@example.com", password)
	button := createTask(t, s, design, "Кнопка", "")
	form := createTask(t, s, design, "Форма", "")

	ivanS := session(t, s, "ivan@example.com")
	text := []byte("hello")
	notes := upload(t, ivanS, button.ID, `C:\fakepath\notes.txt`, text)
	if notes.TaskID != button.ID || notes.Name != "notes.txt" || notes.MimeType != "text/plain; charset=utf-8" ||
		notes.Size != int64(len(text)) || notes.Author.ID != ivan.ID || notes.CreatedAt != "2026-10-21T12:00:00Z" {
		t.Fatalf("uploaded %+v", notes)
	}
	s.Clock.Advance(time.Minute)
	img := pngImage(t)
	diagram := upload(t, ivanS, button.ID, "diagram.png", img)
	if diagram.MimeType != "image/png" || diagram.Size != int64(len(img)) {
		t.Fatalf("uploaded %+v", diagram)
	}
	requireIDs(t, listAttachments(t, s, button.ID), diagram.ID, notes.ID)
	requireIDs(t, listAttachments(t, s, form.ID))

	// A member downloads: everything except images is served for download (ADR-0013)
	for _, c := range []struct {
		id, disposition string
		content         []byte
	}{
		{notes.ID, "attachment; filename=notes.txt", text},
		{diagram.ID, "inline; filename=diagram.png", img},
	} {
		rec := s.Do(http.MethodGet, "/v1/files/"+c.id, nil)
		apitest.RequireStatus(t, rec, http.StatusOK)
		if got := rec.Header().Get("Content-Disposition"); got != c.disposition {
			t.Errorf("Content-Disposition %q, want %q", got, c.disposition)
		}
		if !bytes.Equal(rec.Body.Bytes(), c.content) {
			t.Errorf("%s: content differs from the uploaded one", c.id)
		}
	}
	// A guest is asked to sign in, a user of another project learns nothing
	apitest.RequireError(t, guest(t, s).Do(http.MethodGet, "/v1/files/"+notes.ID, nil), http.StatusUnauthorized, "UNAUTHENTICATED")
	olga := session(t, s, "olga@example.com")
	apitest.RequireError(t, olga.Do(http.MethodGet, "/v1/files/"+notes.ID, nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, olga.Do(http.MethodGet, "/v1/tasks/"+button.ID+"/attachments", nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, olga.Do(http.MethodPost, "/v1/tasks/"+button.ID+"/attachments", attachmentFile("a.txt", text)),
		http.StatusNotFound, "NOT_FOUND")
	// A file addressed through another task's path
	apitest.RequireError(t, s.Do(http.MethodDelete, "/v1/tasks/"+form.ID+"/attachments/"+notes.ID, nil), http.StatusNotFound, "NOT_FOUND")

	// Another member may not delete; the uploader may
	path := "/v1/tasks/" + button.ID + "/attachments/"
	petr := session(t, s, "petr@example.com")
	apitest.RequireError(t, petr.Do(http.MethodDelete, path+notes.ID, nil), http.StatusForbidden, "FORBIDDEN")
	apitest.RequireStatus(t, ivanS.Do(http.MethodDelete, path+notes.ID, nil), http.StatusNoContent)
	apitest.RequireError(t, ivanS.Do(http.MethodDelete, path+notes.ID, nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/files/"+notes.ID, nil), http.StatusNotFound, "NOT_FOUND")
	requireIDs(t, listAttachments(t, s, button.ID), diagram.ID)
	// The owner deletes another's attachment
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path+diagram.ID, nil), http.StatusNoContent)
	requireIDs(t, listAttachments(t, s, button.ID))

	// Cleanup erases the deleted files from disk
	if got := filesOnDisk(t, s); len(got) != 2 {
		t.Fatalf("on disk before cleanup: %v", got)
	}
	erased, err := s.App.File.Cleanup.Execute(context.Background())
	if err != nil || erased != 2 {
		t.Fatalf("erased %d, %v", erased, err)
	}
	if got := filesOnDisk(t, s); len(got) != 0 {
		t.Fatalf("on disk after cleanup: %v", got)
	}
}

// Exactly 25 MB is accepted, one byte more is FILE_TOO_LARGE and nothing stays on disk (ADR-0037).
func TestAttachmentSize(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	button := createTask(t, s, design, "Кнопка", "")

	big := upload(t, s, button.ID, "big.bin", make([]byte, entity.MaxAttachmentSize))
	if big.Size != entity.MaxAttachmentSize || big.MimeType != "application/octet-stream" {
		t.Fatalf("uploaded %+v", big)
	}
	rec := s.Do(http.MethodPost, "/v1/tasks/"+button.ID+"/attachments", attachmentFile("big.bin", make([]byte, entity.MaxAttachmentSize+1)))
	apitest.RequireError(t, rec, http.StatusUnprocessableEntity, "FILE_TOO_LARGE")
	if got := filesOnDisk(t, s); len(got) != 1 || got[0] != big.ID {
		t.Fatalf("on disk: %v", got)
	}
	rec = s.Do(http.MethodPost, "/v1/tasks/"+button.ID+"/attachments", apitest.Multipart{{Name: "other", FileName: "a.txt", Content: []byte("a")}})
	apitest.RequireError(t, rec, http.StatusUnprocessableEntity, "VALIDATION_FAILED")
}

// An archived task is read-only, a moved task keeps its attachments, a deleted one hides them (ADR-0027, ADR-0037).
func TestAttachmentsArchiveMoveDelete(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	backend := createProject(t, s, "Бэкенд").Project.ID
	button := createTask(t, s, design, "Кнопка", "")
	notes := upload(t, s, button.ID, "notes.txt", []byte("hello"))
	taskPath := "/v1/tasks/" + button.ID

	setArchived[task](t, s, taskPath, true)
	apitest.RequireError(t, s.Do(http.MethodPost, taskPath+"/attachments", attachmentFile("a.txt", []byte("a"))), http.StatusConflict, "TASK_ARCHIVED")
	apitest.RequireError(t, s.Do(http.MethodDelete, taskPath+"/attachments/"+notes.ID, nil), http.StatusConflict, "TASK_ARCHIVED")
	requireIDs(t, listAttachments(t, s, button.ID), notes.ID)
	apitest.RequireStatus(t, s.Do(http.MethodGet, "/v1/files/"+notes.ID, nil), http.StatusOK)
	setArchived[task](t, s, taskPath, false)

	// After a move the attachment belongs to the new project's members only
	ivan := session(t, s, "ivan@example.com")
	apitest.RequireStatus(t, ivan.Do(http.MethodGet, "/v1/files/"+notes.ID, nil), http.StatusOK)
	changeTask(t, s, taskPath+"/project", map[string]any{"projectId": backend})
	requireIDs(t, listAttachments(t, s, button.ID), notes.ID)
	apitest.RequireStatus(t, s.Do(http.MethodGet, "/v1/files/"+notes.ID, nil), http.StatusOK)
	apitest.RequireError(t, ivan.Do(http.MethodGet, "/v1/files/"+notes.ID, nil), http.StatusNotFound, "NOT_FOUND")

	apitest.RequireStatus(t, s.Do(http.MethodDelete, taskPath, nil), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/files/"+notes.ID, nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodGet, taskPath+"/attachments", nil), http.StatusNotFound, "NOT_FOUND")
}
