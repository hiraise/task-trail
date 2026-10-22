package middleware

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"task-trail/internal/domain"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/logger"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// NewError превращает ошибку обработчика в ответ ApiError (ADR-0018) и пишет её в лог.
func NewError(l logger.Logger, m *contextmanager.GinContextManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if len(c.Errors) == 0 {
			return
		}
		apiErr := toAPIError(c.Errors.Last().Err, l, m.GetRequestID(c))
		c.AbortWithStatusJSON(apiErr.Status, apiErr)
		// Ошибки уже в логе
		c.Errors = nil
	}
}

// apiErrorFor — что отвечает API на ошибку домена. Ошибки клиента пишутся в лог как
// предупреждения, всё, чего нет в таблице, — как ошибка сервера с ответом INTERNAL.
var apiErrorFor = map[domain.ErrorCode]response.ApiError{
	domain.InvalidCredentials: {Status: http.StatusUnauthorized, Code: response.CodeInvalidCredentials, Message: "неверная почта или пароль"},
	domain.WrongPassword:      {Status: http.StatusUnprocessableEntity, Code: response.CodeWrongPassword, Message: "неверный текущий пароль"},
	domain.PasswordSameAsOld:  {Status: http.StatusUnprocessableEntity, Code: response.CodePasswordSameAsOld, Message: "новый пароль совпадает с текущим"},
	domain.RegistrationClosed: {Status: http.StatusConflict, Code: response.CodeRegistrationClosed, Message: "регистрация закрыта: первый аккаунт уже создан"},
	domain.Forbidden:          {Status: http.StatusForbidden, Code: response.CodeForbidden, Message: "не хватает роли в проекте или прав администратора сервиса"},
	domain.OwnerCannotLeave:   {Status: http.StatusConflict, Code: response.CodeOwnerCannotLeave, Message: "владелец не выходит из проекта, а удаляет его"},
	domain.AssigneeNotMember:  {Status: http.StatusUnprocessableEntity, Code: response.CodeAssigneeNotMember, Message: "исполнитель не участник проекта"},
	domain.LinkInvalid:        {Status: http.StatusUnprocessableEntity, Code: response.CodeLinkInvalid, Message: "ссылка неверна, использована или истекла"},
	domain.InvitationAccepted: {Status: http.StatusConflict, Code: response.CodeInvitationAccepted, Message: "аккаунт с этой почтой уже есть, нужно войти"},
	domain.MailDisabled:       {Status: http.StatusConflict, Code: response.CodeMailDisabled, Message: "почта не подключена"},
	domain.MailSendFailed:     {Status: http.StatusBadGateway, Code: response.CodeMailSendFailed, Message: "SMTP не принял письмо"},
	domain.FileTooLarge:       {Status: http.StatusUnprocessableEntity, Code: response.CodeFileTooLarge, Message: "файл больше допустимого"},
	domain.FileTypeNotAllowed: {Status: http.StatusUnprocessableEntity, Code: response.CodeFileTypeNotAllowed, Message: "тип файла не подходит"},

	domain.RefreshTokenNotFound: {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "нет сессии"},
	domain.RefreshTokenWrong:    {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "сессия недействительна"},
	domain.RefreshTokenRevoked:  {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "сессия закрыта"},
	domain.RefreshTokenReused:   {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "сессия недействительна"},
	domain.RefreshTokenExpired:  {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "сессия истекла"},
	domain.AccessTokenNotFound:  {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "нужен вход"},
	domain.AccessTokenWrong:     {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "сессия недействительна"},
	domain.AccessTokenExpired:   {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "сессия истекла"},
	domain.ParseTokenFailed:     {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "сессия недействительна"},

	domain.EntityNotFound: {Status: http.StatusNotFound, Code: response.CodeNotFound, Message: "не найдено"},
}

func toAPIError(err error, l logger.Logger, reqID string) *response.ApiError {
	var e *domain.DomainError
	if !errors.As(err, &e) {
		l.Error("unexpected error", "requestID", reqID, "error", err)
		return internalError()
	}
	args := []any{"requestID", reqID, "source", e.Source}
	if e.Metadata != nil {
		args = append(args, "metadata", e.Metadata)
	}
	if e.Code == domain.InputValidation {
		apiErr := validationError(e.Unwrap())
		l.Warn(string(e.Code), append(args, "details", apiErr.Details, "message", apiErr.Message)...)
		return apiErr
	}
	known, ok := apiErrorFor[e.Code]
	if !ok {
		// Ошибки репозитория без своего кода — тоже внутренние
		l.Error(string(e.Code), append(args, "error", e.Unwrap())...)
		return internalError()
	}
	if source := e.Unwrap(); source != nil {
		// Причина отказа внешней службы, например ответ SMTP, — администратору в лог
		args = append(args, "error", source)
	}
	l.Warn(string(e.Code), args...)
	return &known
}

func internalError() *response.ApiError {
	return response.NewApiErr(http.StatusInternalServerError, response.CodeInternal, "ошибка сервера")
}

// validationError собирает details: ключ — путь поля, как в JSON запроса (`newPassword`,
// `emails[3]`), значение — что с ним не так.
func validationError(err error) *response.ApiError {
	apiErr := response.NewApiErr(http.StatusUnprocessableEntity, response.CodeValidationFailed, "данные не прошли проверку")
	var fieldErrs validator.ValidationErrors
	var typeErr *json.UnmarshalTypeError
	var bindErrs request.FieldErrors
	switch {
	case errors.As(err, &bindErrs):
		apiErr.Details = bindErrs
	case errors.As(err, &fieldErrs):
		apiErr.Details = make(map[string]string, len(fieldErrs))
		for _, fe := range fieldErrs {
			apiErr.Details[fieldPath(fe)] = messageForTag(fe)
		}
	case errors.As(err, &typeErr) && typeErr.Field != "":
		apiErr.Details = map[string]string{typeErr.Field: "неверный тип значения"}
	case err != nil && strings.HasPrefix(err.Error(), `json: unknown field "`):
		field := strings.TrimSuffix(strings.TrimPrefix(err.Error(), `json: unknown field "`), `"`)
		apiErr.Details = map[string]string{field: "неизвестное поле"}
	case err != nil:
		apiErr.Message = "тело запроса не разобрано: " + err.Error()
	}
	return apiErr
}

// fieldPath убирает из пути валидатора имя структуры запроса: credentials.email → email.
// Имена полей — из тегов json (Setup регистрирует их в валидаторе).
func fieldPath(fe validator.FieldError) string {
	_, path, ok := strings.Cut(fe.Namespace(), ".")
	if !ok {
		return fe.Field()
	}
	return path
}

func messageForTag(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "обязательное поле"
	case "email", "uuid", "url", "uri":
		return "неверный формат"
	case "min":
		return fmt.Sprintf("не короче %s", fe.Param())
	case "max":
		return fmt.Sprintf("не длиннее %s", fe.Param())
	case "maxbytes":
		return fmt.Sprintf("не длиннее %s байт в UTF-8", fe.Param())
	case "httpurl":
		return "нужен адрес http(s) без параметров"
	case "required_without":
		return fmt.Sprintf("обязательно, если нет %s", fe.Param())
	default:
		return "недопустимое значение"
	}
}
