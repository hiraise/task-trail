package entity

import (
	"strings"
	"time"

	"task-trail/internal/domain"
)

type FileID string

// MaxAvatarSize — the avatar limit, 5 MB. The same limit is in the web and in the stand proxy (ADR-0013).
const MaxAvatarSize = 5 << 20

// MaxAttachmentSize — the task attachment limit, 25 MB; the stand proxy accepts bodies up to it (ADR-0037).
const MaxAttachmentSize = 25 << 20

// maxFileNameLength — how many characters of the original name to keep: the name is needed only for
// "Save as", and no file system accepts a longer one.
const maxFileNameLength = 255

// imageTypes — images the browser shows itself and does not execute: only these can be
// an avatar, other files are served for download (ADR-0013).
var imageTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
}

// File — an uploaded file. Contents lie in storage under the ID name; the original name and type are
// only here: the file path is never built from user data (ADR-0013).
type File struct {
	ID FileID
	// OriginalName — the user's file name, without a path.
	OriginalName string
	// MimeType — the type detected from the contents, not from the request header.
	MimeType string
	OwnerID  UserID
	// Size — bytes of the contents; 0 for files uploaded before ADR-0037.
	Size int64
	// CreatedAt — when the file was uploaded. A file never changes by ID, so this is also its update time.
	CreatedAt time.Time
}

// CleanFileName keeps only the name itself from the file name in the request: some browsers
// send a path like C:\fakepath\photo.png.
func CleanFileName(name string) string {
	if i := strings.LastIndexAny(name, `/\`); i >= 0 {
		name = name[i+1:]
	}
	if runes := []rune(name); len(runes) > maxFileNameLength {
		name = string(runes[:maxFileNameLength])
	}
	return name
}

// CheckAvatar checks whether the file can be an avatar: JPEG, PNG or WebP up to 5 MB (ADR-0013).
// mimeType — the type detected from the contents.
func CheckAvatar(size int64, mimeType string) error {
	if size > MaxAvatarSize {
		return domain.ErrFileTooLarge("size", size, "limit", MaxAvatarSize)
	}
	if !imageTypes[mimeType] {
		return domain.ErrFileTypeNotAllowed("mimeType", mimeType)
	}
	return nil
}

// CheckAttachment checks whether the file can be a task attachment: any type up to 25 MB (ADR-0037).
func CheckAttachment(size int64) error {
	if size > MaxAttachmentSize {
		return domain.ErrFileTooLarge("size", size, "limit", MaxAttachmentSize)
	}
	return nil
}

// IsImage — the file can be shown in the browser: JPEG, PNG or WebP. The rest is served
// for download, otherwise HTML or SVG would run someone else's script on the web origin (ADR-0013).
func (f *File) IsImage() bool {
	return imageTypes[f.MimeType]
}
