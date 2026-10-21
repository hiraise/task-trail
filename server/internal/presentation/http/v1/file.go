package v1

import (
	"mime"
	"net/http"

	"task-trail/internal/application/service/file"

	"github.com/gin-gonic/gin"
)

// fileRoutes — содержимое файлов: GET /v1/files/{fileId} в контракте.
type fileRoutes struct {
	services *file.FileModule
}

// get отдаёт файл без входа: сейчас все файлы — аватарки (ADR-0013).
func (r *fileRoutes) get(c *gin.Context) {
	fileID, err := pathID(c, "fileId")
	if err != nil {
		_ = c.Error(err)
		return
	}
	content, err := r.services.Download.Execute(c, fileID)
	if err != nil {
		_ = c.Error(err)
		return
	}
	defer func() { _ = content.Content.Close() }()
	// Картинку браузер показывает, остальное — только скачивает: иначе HTML или SVG выполнит
	// чужой скрипт на origin веба (ADR-0013)
	disposition := "attachment"
	if content.File.IsImage() {
		disposition = "inline"
	}
	// Имя — для «Сохранить как»; не по-английски оно уходит в виде filename*=utf-8''…
	if named := mime.FormatMediaType(disposition, map[string]string{"filename": content.File.OriginalName}); content.File.OriginalName != "" && named != "" {
		disposition = named
	}
	c.DataFromReader(http.StatusOK, content.Size, content.File.MimeType, content.Content, map[string]string{
		"X-Content-Type-Options": "nosniff",
		// Файл по ID не меняется
		"Cache-Control":       "private, max-age=31536000, immutable",
		"Content-Disposition": disposition,
	})
}

func NewFileRouter(router *gin.RouterGroup, services *file.FileModule) {
	r := &fileRoutes{services: services}
	router.GET("/files/:fileId", r.get)
}
