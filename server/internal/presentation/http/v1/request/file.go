package request

import (
	"bytes"
	"fmt"
	"io"
	"path/filepath"
	"task-trail/internal/usecase/dto"

	"github.com/gin-gonic/gin"
)

func BindFileUploadDTO(c *gin.Context, userID int) (*dto.FileUpload, error) {
	file, err := c.FormFile("file")
	if err != nil {
		return nil, err
	}
	mimeType := file.Header.Get("Content-Type")
	if mimeType == "" {
		return nil, fmt.Errorf("mime-type is undefinded")
	}
	name := filepath.Base(file.Filename)

	buf := bytes.NewBuffer(nil)
	f, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("file reading failure: %w", err)
	}
	defer func() {
		_ = f.Close()
	}()

	if _, err = io.Copy(buf, f); err != nil {
		return nil, fmt.Errorf("file copying failure: %w", err)
	}
	if buf.Len() == 0 {
		return nil, fmt.Errorf("file corrupted, file length is 0")
	}
	body := buf.Bytes()
	return &dto.FileUpload{
		UserID: userID,
		File: &dto.UploadFileData{
			Data:     body,
			Name:     name,
			MimeType: mimeType,
		},
	}, nil
}
