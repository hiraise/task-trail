package request

import (
	"errors"
	"io"
	"net/http"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"github.com/gin-gonic/gin"
)

type updateCurrentUserReq struct {
	Username Optional[string] `json:"username" binding:"omitnil,min=1,max=100"`
}

// BindUpdateCurrentUser returns the new name; nil removes the name.
func BindUpdateCurrentUser(c *gin.Context) (*string, error) {
	body, err := validate[updateCurrentUserReq](c)
	if err != nil {
		return nil, err
	}
	return body.Username.Value, nil
}

// multipartOverhead is the request body allowance for multipart boundaries and part headers beyond the file.
// The largest body, entity.MaxAttachmentSize+multipartOverhead, mirrors client_max_body_size of the web
// image proxy (web/docker/nginx.conf.template): change it here — change it there too (ADR-0013, ADR-0037).
// The smaller avatar limit is checked by the server only.
const multipartOverhead = 64 << 10

// uploadField is the multipart/form-data field with the file (contract: uploadAvatar, uploadTaskAttachment).
const uploadField = "file"

// BindAvatar reads the avatar file from multipart/form-data (see bindUpload).
func BindAvatar(c *gin.Context) (dto.Upload, error) {
	return bindUpload(c, entity.MaxAvatarSize)
}

// BindAttachment reads a task attachment from multipart/form-data (see bindUpload).
func BindAttachment(c *gin.Context) (dto.Upload, error) {
	return bindUpload(c, entity.MaxAttachmentSize)
}

// bindUpload reads the only file field. The file is not read beyond limit: the use case checks the size,
// and a body over the limit with allowance is FILE_TOO_LARGE.
func bindUpload(c *gin.Context, limit int64) (dto.Upload, error) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, limit+multipartOverhead)
	reader, err := c.Request.MultipartReader()
	if err != nil {
		// offset 2: the error source in the log is the handler, not the Bind functions
		return dto.Upload{}, domain.ErrInputValidation(2, err)
	}
	var upload *dto.Upload
	for {
		part, err := reader.NextPart()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return dto.Upload{}, bodyError(err)
		}
		if name := part.FormName(); name != uploadField || upload != nil {
			return dto.Upload{}, domain.ErrInputValidation(2, FieldErrors{name: "неизвестное или повторное поле"})
		}
		content, err := io.ReadAll(io.LimitReader(part, limit+1))
		if err != nil {
			return dto.Upload{}, bodyError(err)
		}
		upload = &dto.Upload{Name: part.FileName(), Content: content}
		if int64(len(content)) > limit {
			// Do not read the rest: the file is too large anyway
			break
		}
	}
	if upload == nil {
		return dto.Upload{}, domain.ErrInputValidation(2, FieldErrors{uploadField: "обязательное поле"})
	}
	return *upload, nil
}

// bodyError: the request body was not read fully: over the limit — FILE_TOO_LARGE, otherwise the body could not be parsed.
func bodyError(err error) error {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		return domain.ErrFileTooLarge("limit", tooLarge.Limit)
	}
	return domain.ErrInputValidation(3, err)
}
