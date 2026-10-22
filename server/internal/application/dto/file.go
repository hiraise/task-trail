package dto

import (
	"io"

	"task-trail/internal/domain/entity"
)

// Upload is a file from a request: the user's file name and the content.
type Upload struct {
	Name    string
	Content []byte
}

// FileContent is a file for a response. Whoever reads Content closes it.
type FileContent struct {
	File    *entity.File
	Content io.ReadCloser
	Size    int64
}
