package v1_test

import (
	"bytes"
	"context"
	"image"
	"image/jpeg"
	"image/png"
	"net/http"
	"net/http/cookiejar"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
	"task-trail/test/apitest"
	"task-trail/test/contract"
)

type user struct {
	ID       string  `json:"id"`
	Email    string  `json:"email"`
	Username *string `json:"username"`
	AvatarID *string `json:"avatarId"`
}

func pngImage(t *testing.T) []byte {
	t.Helper()
	var b bytes.Buffer
	if err := png.Encode(&b, image.NewRGBA(image.Rect(0, 0, 2, 2))); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}

func jpegImage(t *testing.T) []byte {
	t.Helper()
	var b bytes.Buffer
	if err := jpeg.Encode(&b, image.NewRGBA(image.Rect(0, 0, 2, 2)), nil); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}

func avatar(name string, content []byte) apitest.Multipart {
	return apitest.Multipart{{Name: "file", FileName: name, Content: content}}
}

// withPNGSignature is content of the given size whose first bytes make it a PNG.
func withPNGSignature(size int) []byte {
	content := make([]byte, size)
	copy(content, "\x89PNG\x0D\x0A\x1A\x0A")
	return content
}

// filesOnDisk are the file names in the server's FILES_DIR folder.
func filesOnDisk(t *testing.T, s *apitest.Server) []string {
	t.Helper()
	entries, err := os.ReadDir(s.FilesDir)
	if err != nil {
		t.Fatal(err)
	}
	var names []string
	for _, e := range entries {
		names = append(names, e.Name())
	}
	return names
}

// anonymous forgets the cookies: next requests are unauthenticated.
func anonymous(t *testing.T, s *apitest.Server) {
	t.Helper()
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	s.Jar = jar
}

func TestCurrentUser(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)

	rec := s.Do(http.MethodGet, "/v1/users/me", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[currentUser](t, rec); got.ID != admin.ID || got.Email != "admin@example.com" || !got.IsAdmin {
		t.Fatalf("current user: %+v", got)
	}

	rec = s.Do(http.MethodPatch, "/v1/users/me", map[string]any{"username": "Анна Петрова"})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[currentUser](t, rec); got.Username == nil || *got.Username != "Анна Петрова" || !got.IsAdmin {
		t.Fatalf("after renaming: %+v", got)
	}
	// null removes the name
	rec = s.Do(http.MethodPatch, "/v1/users/me", `{"username": null}`)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[currentUser](t, rec); got.Username != nil {
		t.Fatalf("name not removed: %+v", got)
	}
	rec = s.Do(http.MethodGet, "/v1/users/me", nil)
	if got := apitest.Decode[currentUser](t, rec); got.Username != nil {
		t.Fatalf("name not saved: %+v", got)
	}

	anonymous(t, s)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/users/me", nil), http.StatusUnauthorized, "UNAUTHENTICATED")
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me", map[string]any{"username": "Анна"}), http.StatusUnauthorized, "UNAUTHENTICATED")
}

// The name is required in the request but may be null; empty or longer than 100 characters is an error.
func TestRenameValidation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	for body, field := range map[string]string{
		`{}`:               "username",
		`{"username": ""}`: "username",
		`{"username": "` + strings.Repeat("я", 101) + `"}`: "username",
		`{"username": "Анна", "email": "a@b.c"}`:           "email",
		// encoding/json reports a wrong type in a nullable field without the field name
		`{"username": 5}`: "",
	} {
		apiErr := apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me", body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details[field]; field != "" && !ok {
			t.Errorf("%s: details lack %s: %v", body, field, apiErr.Details)
		}
	}
	rec := s.Do(http.MethodPatch, "/v1/users/me", map[string]any{"username": strings.Repeat("я", 100)})
	apitest.RequireStatus(t, rec, http.StatusOK)
}

// An avatar replaces the previous one: the previous file is no longer served, and cleanup erases it from disk.
// The file is served without sign-in, with the headers from ADR-0013.
func TestAvatar(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)

	first := pngImage(t)
	rec := s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar(`C:\fakepath\Моё фото.png`, first))
	apitest.RequireStatus(t, rec, http.StatusOK)
	me := apitest.Decode[currentUser](t, rec)
	if me.AvatarID == nil || !me.IsAdmin {
		t.Fatalf("after upload: %+v", me)
	}
	firstID := *me.AvatarID
	rec = s.Do(http.MethodGet, "/v1/users/me", nil)
	if got := apitest.Decode[currentUser](t, rec); got.AvatarID == nil || *got.AvatarID != firstID {
		t.Fatalf("avatar not saved: %+v", got)
	}

	// The type comes from the content: a JPEG named .png stays JPEG
	second := jpegImage(t)
	rec = s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar("photo.png", second))
	apitest.RequireStatus(t, rec, http.StatusOK)
	secondID := *apitest.Decode[currentUser](t, rec).AvatarID
	if secondID == firstID {
		t.Fatal("avatar ID did not change")
	}

	anonymous(t, s)
	rec = s.Do(http.MethodGet, "/v1/files/"+secondID, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	for header, want := range map[string]string{
		"Content-Type":           "image/jpeg",
		"X-Content-Type-Options": "nosniff",
		"Cache-Control":          "private, max-age=31536000, immutable",
		"Content-Disposition":    `inline; filename=photo.png`,
	} {
		if got := rec.Header().Get(header); got != want {
			t.Errorf("%s: %q, expected %q", header, got, want)
		}
	}
	if !bytes.Equal(rec.Body.Bytes(), second) {
		t.Error("file content differs from the uploaded one")
	}

	// The previous avatar is not served but stays on disk until cleanup
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/files/"+firstID, nil), http.StatusNotFound, "NOT_FOUND")
	if got := filesOnDisk(t, s); len(got) != 2 {
		t.Fatalf("on disk before cleanup: %v", got)
	}
	erased, err := s.App.File.Cleanup.Execute(context.Background())
	if err != nil || erased != 1 {
		t.Fatalf("erased %d, %v", erased, err)
	}
	if got := filesOnDisk(t, s); len(got) != 1 || got[0] != secondID {
		t.Fatalf("on disk after cleanup: %v", got)
	}
	var deletedAt *time.Time
	if err := s.Pool.QueryRow(context.Background(), `SELECT deleted_at FROM files WHERE id = $1`, firstID).Scan(&deletedAt); err != nil || deletedAt == nil {
		t.Fatalf("erased file not marked in the database: %v, %v", deletedAt, err)
	}

	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar("a.png", first)), http.StatusUnauthorized, "UNAUTHENTICATED")
}

// A non-ASCII file name goes into filename*, and any file except images is download-only.
func TestFileContentDisposition(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	ctx := context.Background()

	rec := s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar("Фото.png", pngImage(t)))
	apitest.RequireStatus(t, rec, http.StatusOK)
	rec = s.Do(http.MethodGet, "/v1/files/"+*apitest.Decode[currentUser](t, rec).AvatarID, nil)
	if got := rec.Header().Get("Content-Disposition"); got != `inline; filename*=utf-8''%D0%A4%D0%BE%D1%82%D0%BE.png` {
		t.Errorf("Content-Disposition: %q", got)
	}

	// There are no attachments yet (stage 3): a file of another type is put straight into the database and onto disk
	const fileID = "0b8f8a52-9c2e-4d5f-8a1b-3c4d5e6f7a8b"
	if _, err := s.Pool.Exec(ctx, `INSERT INTO files (id, original_name, mime_type, owner_id) VALUES ($1, 'page.html', 'text/html; charset=utf-8', $2)`,
		fileID, admin.ID); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(s.FilesDir, fileID), []byte("<script>alert(1)</script>"), 0o600); err != nil {
		t.Fatal(err)
	}
	rec = s.Do(http.MethodGet, "/v1/files/"+fileID, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := rec.Header().Get("Content-Disposition"); got != "attachment; filename=page.html" {
		t.Errorf("Content-Disposition: %q", got)
	}
}

func TestAvatarRejected(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)

	// Exactly 5 MB is allowed
	rec := s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar("big.png", withPNGSignature(entity.MaxAvatarSize)))
	apitest.RequireStatus(t, rec, http.StatusOK)
	avatarID := *apitest.Decode[currentUser](t, rec).AvatarID

	for name, body := range map[string]apitest.Multipart{
		"one byte over 5 MB": avatar("big.png", withPNGSignature(entity.MaxAvatarSize+1)),
		"much larger":        avatar("big.png", withPNGSignature(8<<20)),
	} {
		t.Run(name, func(t *testing.T) {
			apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me/avatar", body), http.StatusUnprocessableEntity, "FILE_TOO_LARGE")
		})
	}
	for name, content := range map[string][]byte{
		"SVG":       []byte(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`),
		"HTML":      []byte(`<!DOCTYPE html><script>alert(1)</script>`),
		"GIF":       []byte("GIF89a\x01\x00\x01\x00\x00\x00\x00;"),
		"empty":     {},
		"text":      []byte("hello"),
		"PDF":       []byte("%PDF-1.7\n"),
		"truncated": []byte("\x89PN"),
	} {
		t.Run(name, func(t *testing.T) {
			rec := s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar("photo.png", content))
			apitest.RequireError(t, rec, http.StatusUnprocessableEntity, "FILE_TYPE_NOT_ALLOWED")
		})
	}
	for name, c := range map[string]struct {
		body  any
		field string
	}{
		"no file":       {apitest.Multipart{{Name: "comment", Content: []byte("x")}}, "comment"},
		"nothing":       {apitest.Multipart{}, "file"},
		"unknown field": {apitest.Multipart{{Name: "file", FileName: "a.png", Content: pngImage(t)}, {Name: "comment", Content: []byte("x")}}, "comment"},
		"two files":     {apitest.Multipart{{Name: "file", FileName: "a.png", Content: pngImage(t)}, {Name: "file", FileName: "b.png", Content: pngImage(t)}}, "file"},
		"JSON":          {map[string]string{"file": "x"}, ""},
	} {
		t.Run(name, func(t *testing.T) {
			apiErr := apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me/avatar", c.body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
			if _, ok := apiErr.Details[c.field]; c.field != "" && !ok {
				t.Errorf("details lack %s: %v", c.field, apiErr.Details)
			}
		})
	}

	// Rejected files do not change the avatar and do not stay on disk
	rec = s.Do(http.MethodGet, "/v1/users/me", nil)
	if got := apitest.Decode[currentUser](t, rec); got.AvatarID == nil || *got.AvatarID != avatarID {
		t.Fatalf("avatar: %+v", got)
	}
	if got := filesOnDisk(t, s); len(got) != 1 || got[0] != avatarID {
		t.Fatalf("on disk: %v", got)
	}
}

func TestFileNotFound(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	for _, id := range []string{"not-a-uuid", "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e", "5F0C1B528D4E4A8B9C7E2B1D3F4A5C6E"} {
		apitest.RequireError(t, s.Do(http.MethodGet, "/v1/files/"+id, nil), http.StatusNotFound, "NOT_FOUND")
	}
}

// Cleanup erases files older than a day that have no database record — leftovers of an interrupted
// upload. Fresh files, files known to the database and foreign (non-UUID) files stay (ADR-0013).
func TestCleanupOrphanFiles(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	rec := s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar("a.png", pngImage(t)))
	apitest.RequireStatus(t, rec, http.StatusOK)
	known := *apitest.Decode[currentUser](t, rec).AvatarID

	const orphan, fresh = "11111111-2222-4333-8444-555555555555", "66666666-7777-4888-8999-aaaaaaaaaaaa"
	old := apitest.Start.Add(-25 * time.Hour)
	for name, modified := range map[string]time.Time{orphan: old, fresh: apitest.Start.Add(-time.Hour), "notes.txt": old, known: old} {
		path := filepath.Join(s.FilesDir, name)
		if name != known {
			if err := os.WriteFile(path, []byte("x"), 0o600); err != nil {
				t.Fatal(err)
			}
		}
		if err := os.Chtimes(path, modified, modified); err != nil {
			t.Fatal(err)
		}
	}
	erased, err := s.App.File.Cleanup.Execute(context.Background())
	if err != nil || erased != 1 {
		t.Fatalf("erased %d, %v", erased, err)
	}
	got := strings.Join(filesOnDisk(t, s), " ")
	if strings.Contains(got, orphan) || !strings.Contains(got, fresh) || !strings.Contains(got, known) || !strings.Contains(got, "notes.txt") {
		t.Fatalf("on disk after cleanup: %s", got)
	}
}

// A user is visible if it is you, you share a project, or they authored a task in your project —
// even after leaving the project. Deleted projects and tasks do not count; others get 404.
func TestGetUser(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	ctx := context.Background()
	admin := registerAdmin(t, s)
	accept := func(project, email string) currentUser {
		t.Helper()
		rec := s.Do(http.MethodPost, "/v1/auth/invitations/accept", acceptBody(s.Invite(project, email, admin.ID)))
		apitest.RequireStatus(t, rec, http.StatusCreated)
		return apitest.Decode[currentUser](t, rec)
	}
	design := s.CreateProject("Дизайн-система")
	s.AddMember(design, admin.ID, entity.RoleOwner)
	ivan := accept(design, "ivan@example.com")
	backend := s.CreateProject("Бэкенд")
	s.AddMember(backend, admin.ID, entity.RoleOwner)
	petr := accept(backend, "petr@example.com")
	task := createTask(t, s, backend, "Сверстать вход", "").ID
	s.RemoveMember(backend, petr.ID)
	stranger := accept(s.CreateProject("Чужой"), "stranger@example.com")

	visible := func(viewer string, users map[string]bool) {
		t.Helper()
		login(t, s, viewer, password)
		for id, ok := range users {
			rec := s.Do(http.MethodGet, "/v1/users/"+id, nil)
			if !ok {
				apitest.RequireError(t, rec, http.StatusNotFound, "NOT_FOUND")
				continue
			}
			apitest.RequireStatus(t, rec, http.StatusOK)
			if got := apitest.Decode[user](t, rec); got.ID != id || got.Email == "" {
				t.Errorf("%s sees %+v", viewer, got)
			}
		}
	}
	visible("ivan@example.com", map[string]bool{ivan.ID: true, admin.ID: true, petr.ID: false, stranger.ID: false})
	visible("admin@example.com", map[string]bool{ivan.ID: true, petr.ID: true, stranger.ID: false})

	if _, err := s.Pool.Exec(ctx, `UPDATE tasks SET deleted_at = now() WHERE id = $1`, task); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Pool.Exec(ctx, `UPDATE projects SET deleted_at = now() WHERE id = $1`, design); err != nil {
		t.Fatal(err)
	}
	visible("admin@example.com", map[string]bool{admin.ID: true, ivan.ID: false, petr.ID: false})

	for _, id := range []string{"me-not-uuid", "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e"} {
		apitest.RequireError(t, s.Do(http.MethodGet, "/v1/users/"+id, nil), http.StatusNotFound, "NOT_FOUND")
	}
	anonymous(t, s)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/users/"+admin.ID, nil), http.StatusUnauthorized, "UNAUTHENTICATED")
}
