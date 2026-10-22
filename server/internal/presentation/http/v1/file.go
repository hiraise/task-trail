package v1

import (
	"mime"
	"net/http"

	"task-trail/internal/application/service/file"

	"github.com/gin-gonic/gin"
)

// fileRoutes serve file contents: GET /v1/files/{fileId} in the contract.
type fileRoutes struct {
	services *file.FileModule
}

// get serves a file without sign-in: for now all files are avatars (ADR-0013).
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
	// The browser displays an image and only downloads anything else: otherwise HTML or SVG would run
	// a foreign script on the web origin (ADR-0013)
	disposition := "attachment"
	if content.File.IsImage() {
		disposition = "inline"
	}
	// The name is for "Save as"; a non-ASCII name is sent as filename*=utf-8''…
	if named := mime.FormatMediaType(disposition, map[string]string{"filename": content.File.OriginalName}); content.File.OriginalName != "" && named != "" {
		disposition = named
	}
	c.DataFromReader(http.StatusOK, content.Size, content.File.MimeType, content.Content, map[string]string{
		"X-Content-Type-Options": "nosniff",
		// A file never changes under its ID
		"Cache-Control":       "private, max-age=31536000, immutable",
		"Content-Disposition": disposition,
	})
}

func NewFileRouter(router *gin.RouterGroup, services *file.FileModule) {
	r := &fileRoutes{services: services}
	router.GET("/files/:fileId", r.get)
}
