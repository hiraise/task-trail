package entity

import (
	"strings"
	"time"

	"task-trail/internal/domain"
)

type FileID string

// MaxAvatarSize — предел аватарки, 5 МБ. Тот же предел — в вебе и в прокси стенда (ADR-0013).
const MaxAvatarSize = 5 << 20

// maxFileNameLength — сколько символов исходного имени хранить: имя нужно только для
// «Сохранить как», а длиннее его не пропустит ни одна файловая система.
const maxFileNameLength = 255

// imageTypes — картинки, которые браузер показывает сам и не выполняет: аватаркой может быть
// только такая, остальные файлы отдаются на скачивание (ADR-0013).
var imageTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

// File — загруженный файл. Содержимое лежит в хранилище под именем ID; исходное имя и тип —
// только здесь: путь к файлу из данных пользователя не строится (ADR-0013).
type File struct {
	ID FileID
	// OriginalName — имя файла у пользователя, без пути.
	OriginalName string
	// MimeType — тип, определённый по содержимому, а не по заголовку запроса.
	MimeType string
	OwnerID  UserID
	// CreatedAt — когда файл загружен. Файл по ID не меняется, поэтому это и время его изменения.
	CreatedAt time.Time
}

// CleanFileName оставляет от имени файла из запроса только само имя: некоторые браузеры
// присылают путь вида C:\fakepath\photo.png.
func CleanFileName(name string) string {
	if i := strings.LastIndexAny(name, `/\`); i >= 0 {
		name = name[i+1:]
	}
	if runes := []rune(name); len(runes) > maxFileNameLength {
		name = string(runes[:maxFileNameLength])
	}
	return name
}

// CheckAvatar проверяет, годится ли файл в аватарки: JPEG, PNG или WebP до 5 МБ (ADR-0013).
// mimeType — тип, определённый по содержимому.
func CheckAvatar(size int64, mimeType string) error {
	if size > MaxAvatarSize {
		return domain.ErrFileTooLarge("size", size, "limit", MaxAvatarSize)
	}
	if !imageTypes[mimeType] {
		return domain.ErrFileTypeNotAllowed("mimeType", mimeType)
	}
	return nil
}

// IsImage — файл можно показать в браузере: JPEG, PNG или WebP. Остальное отдаётся
// на скачивание, иначе HTML или SVG выполнит чужой скрипт на origin веба (ADR-0013).
func (f *File) IsImage() bool {
	return imageTypes[f.MimeType]
}
