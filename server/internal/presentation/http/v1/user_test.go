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

// withPNGSignature — содержимое размером size, которое по первым байтам — PNG.
func withPNGSignature(size int) []byte {
	content := make([]byte, size)
	copy(content, "\x89PNG\x0D\x0A\x1A\x0A")
	return content
}

// filesOnDisk — имена файлов в папке FILES_DIR сервера.
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

// anonymous забывает cookie: следующие запросы — без входа.
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
		t.Fatalf("текущий пользователь: %+v", got)
	}

	rec = s.Do(http.MethodPatch, "/v1/users/me", map[string]any{"username": "Анна Петрова"})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[currentUser](t, rec); got.Username == nil || *got.Username != "Анна Петрова" || !got.IsAdmin {
		t.Fatalf("после смены имени: %+v", got)
	}
	// null убирает имя
	rec = s.Do(http.MethodPatch, "/v1/users/me", `{"username": null}`)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[currentUser](t, rec); got.Username != nil {
		t.Fatalf("имя не убрано: %+v", got)
	}
	rec = s.Do(http.MethodGet, "/v1/users/me", nil)
	if got := apitest.Decode[currentUser](t, rec); got.Username != nil {
		t.Fatalf("имя не сохранилось: %+v", got)
	}

	anonymous(t, s)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/users/me", nil), http.StatusUnauthorized, "UNAUTHENTICATED")
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me", map[string]any{"username": "Анна"}), http.StatusUnauthorized, "UNAUTHENTICATED")
}

// Имя обязательно в запросе, но может быть null; пустое и длиннее 100 символов — ошибка.
func TestRenameValidation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	for body, field := range map[string]string{
		`{}`:               "username",
		`{"username": ""}`: "username",
		`{"username": "` + strings.Repeat("я", 101) + `"}`: "username",
		`{"username": "Анна", "email": "a@b.c"}`:           "email",
		// Неверный тип в поле, которое может быть null, encoding/json сообщает без имени поля
		`{"username": 5}`: "",
	} {
		apiErr := apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me", body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details[field]; field != "" && !ok {
			t.Errorf("%s: в details нет %s: %v", body, field, apiErr.Details)
		}
	}
	rec := s.Do(http.MethodPatch, "/v1/users/me", map[string]any{"username": strings.Repeat("я", 100)})
	apitest.RequireStatus(t, rec, http.StatusOK)
}

// Аватарка заменяет прежнюю: прежний файл больше не отдаётся, а очистка стирает его с диска.
// Файл отдаётся без входа, с заголовками из ADR-0013.
func TestAvatar(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)

	first := pngImage(t)
	rec := s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar(`C:\fakepath\Моё фото.png`, first))
	apitest.RequireStatus(t, rec, http.StatusOK)
	me := apitest.Decode[currentUser](t, rec)
	if me.AvatarID == nil || !me.IsAdmin {
		t.Fatalf("после загрузки: %+v", me)
	}
	firstID := *me.AvatarID
	rec = s.Do(http.MethodGet, "/v1/users/me", nil)
	if got := apitest.Decode[currentUser](t, rec); got.AvatarID == nil || *got.AvatarID != firstID {
		t.Fatalf("аватарка не сохранилась: %+v", got)
	}

	// Тип — по содержимому: JPEG с именем .png остаётся JPEG
	second := jpegImage(t)
	rec = s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar("photo.png", second))
	apitest.RequireStatus(t, rec, http.StatusOK)
	secondID := *apitest.Decode[currentUser](t, rec).AvatarID
	if secondID == firstID {
		t.Fatal("ID аватарки не сменился")
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
			t.Errorf("%s: %q, ожидалось %q", header, got, want)
		}
	}
	if !bytes.Equal(rec.Body.Bytes(), second) {
		t.Error("содержимое файла отличается от загруженного")
	}

	// Прежняя аватарка не отдаётся, но лежит на диске до очистки
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/files/"+firstID, nil), http.StatusNotFound, "NOT_FOUND")
	if got := filesOnDisk(t, s); len(got) != 2 {
		t.Fatalf("на диске до очистки: %v", got)
	}
	erased, err := s.App.File.Cleanup.Execute(context.Background())
	if err != nil || erased != 1 {
		t.Fatalf("стёрто %d, %v", erased, err)
	}
	if got := filesOnDisk(t, s); len(got) != 1 || got[0] != secondID {
		t.Fatalf("на диске после очистки: %v", got)
	}
	var deletedAt *time.Time
	if err := s.Pool.QueryRow(context.Background(), `SELECT deleted_at FROM files WHERE id = $1`, firstID).Scan(&deletedAt); err != nil || deletedAt == nil {
		t.Fatalf("стёртый файл не отмечен в базе: %v, %v", deletedAt, err)
	}

	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar("a.png", first)), http.StatusUnauthorized, "UNAUTHENTICATED")
}

// Имя файла не по-английски уходит в filename*, а файл, кроме картинок, — только на скачивание.
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

	// Вложений ещё нет (этап 3): файл другого типа кладётся прямо в базу и на диск
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

	// Ровно 5 МБ — можно
	rec := s.Do(http.MethodPatch, "/v1/users/me/avatar", avatar("big.png", withPNGSignature(entity.MaxAvatarSize)))
	apitest.RequireStatus(t, rec, http.StatusOK)
	avatarID := *apitest.Decode[currentUser](t, rec).AvatarID

	for name, body := range map[string]apitest.Multipart{
		"на байт больше 5 МБ": avatar("big.png", withPNGSignature(entity.MaxAvatarSize+1)),
		"намного больше":      avatar("big.png", withPNGSignature(8<<20)),
	} {
		t.Run(name, func(t *testing.T) {
			apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me/avatar", body), http.StatusUnprocessableEntity, "FILE_TOO_LARGE")
		})
	}
	for name, content := range map[string][]byte{
		"SVG":     []byte(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`),
		"HTML":    []byte(`<!DOCTYPE html><script>alert(1)</script>`),
		"GIF":     []byte("GIF89a\x01\x00\x01\x00\x00\x00\x00;"),
		"пустой":  {},
		"текст":   []byte("hello"),
		"PDF":     []byte("%PDF-1.7\n"),
		"обрывок": []byte("\x89PN"),
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
		"без файла":   {apitest.Multipart{{Name: "comment", Content: []byte("x")}}, "comment"},
		"пусто":       {apitest.Multipart{}, "file"},
		"лишнее поле": {apitest.Multipart{{Name: "file", FileName: "a.png", Content: pngImage(t)}, {Name: "comment", Content: []byte("x")}}, "comment"},
		"два файла":   {apitest.Multipart{{Name: "file", FileName: "a.png", Content: pngImage(t)}, {Name: "file", FileName: "b.png", Content: pngImage(t)}}, "file"},
		"JSON":        {map[string]string{"file": "x"}, ""},
	} {
		t.Run(name, func(t *testing.T) {
			apiErr := apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me/avatar", c.body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
			if _, ok := apiErr.Details[c.field]; c.field != "" && !ok {
				t.Errorf("в details нет %s: %v", c.field, apiErr.Details)
			}
		})
	}

	// Отклонённые файлы не меняют аватарку и не остаются на диске
	rec = s.Do(http.MethodGet, "/v1/users/me", nil)
	if got := apitest.Decode[currentUser](t, rec); got.AvatarID == nil || *got.AvatarID != avatarID {
		t.Fatalf("аватарка: %+v", got)
	}
	if got := filesOnDisk(t, s); len(got) != 1 || got[0] != avatarID {
		t.Fatalf("на диске: %v", got)
	}
}

func TestFileNotFound(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	for _, id := range []string{"not-a-uuid", "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e", "5F0C1B528D4E4A8B9C7E2B1D3F4A5C6E"} {
		apitest.RequireError(t, s.Do(http.MethodGet, "/v1/files/"+id, nil), http.StatusNotFound, "NOT_FOUND")
	}
}

// Очистка стирает файлы старше суток, у которых нет записи в базе, — мусор прерванной
// загрузки. Свежие, известные базе и чужие (не UUID) файлы остаются (ADR-0013).
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
		t.Fatalf("стёрто %d, %v", erased, err)
	}
	got := strings.Join(filesOnDisk(t, s), " ")
	if strings.Contains(got, orphan) || !strings.Contains(got, fresh) || !strings.Contains(got, known) || !strings.Contains(got, "notes.txt") {
		t.Fatalf("на диске после очистки: %s", got)
	}
}

// Пользователь виден, если это вы, у вас общий проект или он автор задачи в вашем проекте —
// и после выхода из проекта. Удалённые проекты и задачи не в счёт; остальные — 404.
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
				t.Errorf("%s видит %+v", viewer, got)
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
