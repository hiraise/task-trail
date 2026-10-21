package dto

import (
	"io"

	"task-trail/internal/domain/entity"
)

// Upload — файл из запроса: имя у пользователя и содержимое.
type Upload struct {
	Name    string
	Content []byte
}

// FileContent — файл для ответа. Content закрывает тот, кто его прочитал.
type FileContent struct {
	File    *entity.File
	Content io.ReadCloser
	Size    int64
}
