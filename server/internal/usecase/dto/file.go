package dto

import "time"

// entity

type File struct {
	ID            string
	OriginalName  string
	MimeType      string
	OwnerID       int
	CreatedAt     time.Time
	SoftDeletedAt *time.Time
	DeletedAt     *time.Time
}

// request
type FileUpload struct {
	UserID int
	File   *UploadFileData
}
type UploadFileData struct {
	Data     []byte
	Name     string
	MimeType string
}

type FileCreate struct {
	ID           string
	OriginalName string
	OwnerID      int
	MimeType     string
}

// response
