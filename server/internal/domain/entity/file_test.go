package entity_test

import (
	"strings"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
)

// An avatar is JPEG, PNG or WebP up to 5 MB inclusive (ADR-0013).
func TestCheckAvatar(t *testing.T) {
	cases := []struct {
		size     int64
		mimeType string
		want     domain.ErrorCode
	}{
		{entity.MaxAvatarSize, "image/png", ""},
		{1, "image/jpeg", ""},
		{1, "image/webp", ""},
		{entity.MaxAvatarSize + 1, "image/png", domain.FileTooLarge},
		{1, "image/gif", domain.FileTypeNotAllowed},
		{1, "image/svg+xml", domain.FileTypeNotAllowed},
		{1, "text/html; charset=utf-8", domain.FileTypeNotAllowed},
	}
	for _, c := range cases {
		err := entity.CheckAvatar(c.size, c.mimeType)
		if (c.want == "" && err != nil) || (c.want != "" && !domain.HasCode(err, c.want)) {
			t.Errorf("%d bytes %s: %v, want %q", c.size, c.mimeType, err, c.want)
		}
	}
}

// The browser shows only images, the rest is served for download (ADR-0013).
func TestFileIsImage(t *testing.T) {
	for mimeType, want := range map[string]bool{
		"image/png": true, "image/jpeg": true, "image/webp": true,
		"image/svg+xml": false, "text/html; charset=utf-8": false, "application/pdf": false,
	} {
		if got := (&entity.File{MimeType: mimeType}).IsImage(); got != want {
			t.Errorf("%s: %v", mimeType, got)
		}
	}
}

func TestCleanFileName(t *testing.T) {
	for name, want := range map[string]string{
		"photo.png":                "photo.png",
		`C:\fakepath\Моё фото.png`: "Моё фото.png",
		"../../etc/passwd":         "passwd",
		"dir/":                     "",
		strings.Repeat("я", 300):   strings.Repeat("я", 255),
	} {
		if got := entity.CleanFileName(name); got != want {
			t.Errorf("%q → %q, want %q", name, got, want)
		}
	}
}

func TestReplaceAvatar(t *testing.T) {
	now := time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)
	u := &entity.UserAccount{}
	if previous := u.ReplaceAvatar("first", now); previous != nil {
		t.Fatalf("previous avatar of a new user: %v", *previous)
	}
	previous := u.ReplaceAvatar("second", now.Add(time.Hour))
	if previous == nil || *previous != "first" || *u.AvatarID != "second" || !u.UpdatedAt.Equal(now.Add(time.Hour)) {
		t.Fatalf("previous %v, user %+v", previous, u)
	}
}

// An attachment is any file up to 25 MB inclusive (ADR-0037).
func TestCheckAttachment(t *testing.T) {
	if err := entity.CheckAttachment(entity.MaxAttachmentSize); err != nil {
		t.Errorf("exactly 25 MB: %v", err)
	}
	if err := entity.CheckAttachment(entity.MaxAttachmentSize + 1); !domain.HasCode(err, domain.FileTooLarge) {
		t.Errorf("25 MB + 1 byte: %v, want %s", err, domain.FileTooLarge)
	}
}
