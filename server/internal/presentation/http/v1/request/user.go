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
// The body limit entity.MaxAvatarSize+multipartOverhead mirrors client_max_body_size of the stand
// proxy (stand/nginx.conf.template): change it here — change it there too (ADR-0013).
const multipartOverhead = 64 << 10

// avatarField is the multipart/form-data field with the avatar file (contract, PATCH /v1/users/me/avatar).
const avatarField = "file"

// BindAvatar reads the avatar file from multipart/form-data. The file is not read beyond
// entity.MaxAvatarSize: the use case checks the size, and a body over the limit with allowance is FILE_TOO_LARGE.
func BindAvatar(c *gin.Context) (dto.Upload, error) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, entity.MaxAvatarSize+multipartOverhead)
	reader, err := c.Request.MultipartReader()
	if err != nil {
		// offset 1: the error source in the log is the handler, not this function
		return dto.Upload{}, domain.ErrInputValidation(1, err)
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
		if name := part.FormName(); name != avatarField || upload != nil {
			return dto.Upload{}, domain.ErrInputValidation(1, FieldErrors{name: "неизвестное или повторное поле"})
		}
		content, err := io.ReadAll(io.LimitReader(part, entity.MaxAvatarSize+1))
		if err != nil {
			return dto.Upload{}, bodyError(err)
		}
		upload = &dto.Upload{Name: part.FileName(), Content: content}
		if len(content) > entity.MaxAvatarSize {
			// Do not read the rest: the file is too large anyway
			break
		}
	}
	if upload == nil {
		return dto.Upload{}, domain.ErrInputValidation(1, FieldErrors{avatarField: "обязательное поле"})
	}
	return *upload, nil
}

// bodyError: the request body was not read fully: over the limit — FILE_TOO_LARGE, otherwise the body could not be parsed.
func bodyError(err error) error {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		return domain.ErrFileTooLarge("limit", tooLarge.Limit)
	}
	return domain.ErrInputValidation(2, err)
}
