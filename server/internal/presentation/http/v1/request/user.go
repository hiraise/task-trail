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

// BindUpdateCurrentUser возвращает новое имя; nil — убрать имя.
func BindUpdateCurrentUser(c *gin.Context) (*string, error) {
	body, err := validate[updateCurrentUserReq](c)
	if err != nil {
		return nil, err
	}
	return body.Username.Value, nil
}

// multipartOverhead — запас тела запроса на границы и заголовки частей multipart сверх файла.
// Предел тела entity.MaxAvatarSize+multipartOverhead повторяет client_max_body_size прокси
// стенда (stand/nginx.conf.template): меняешь здесь — поменяй и там (ADR-0013).
const multipartOverhead = 64 << 10

// avatarField — поле multipart/form-data с файлом аватарки (контракт, PATCH /v1/users/me/avatar).
const avatarField = "file"

// BindAvatar читает файл аватарки из multipart/form-data. Больше entity.MaxAvatarSize файл
// не дочитывается: размер проверит сценарий, а тело сверх предела с запасом — FILE_TOO_LARGE.
func BindAvatar(c *gin.Context) (dto.Upload, error) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, entity.MaxAvatarSize+multipartOverhead)
	reader, err := c.Request.MultipartReader()
	if err != nil {
		// offset 1 — источник ошибки в логе: обработчик, а не эта функция
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
			// Остаток не читаем: файл всё равно слишком большой
			break
		}
	}
	if upload == nil {
		return dto.Upload{}, domain.ErrInputValidation(1, FieldErrors{avatarField: "обязательное поле"})
	}
	return *upload, nil
}

// bodyError — тело запроса не дочитано: сверх предела — FILE_TOO_LARGE, иначе тело не разобрано.
func bodyError(err error) error {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		return domain.ErrFileTooLarge("limit", tooLarge.Limit)
	}
	return domain.ErrInputValidation(2, err)
}
