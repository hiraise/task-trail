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

// NewError turns a handler error into an ApiError response (ADR-0018) and logs it.
func NewError(l logger.Logger, m *contextmanager.GinContextManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		if len(c.Errors) == 0 {
			return
		}
		apiErr := toAPIError(c.Errors.Last().Err, l, m.GetRequestID(c))
		c.AbortWithStatusJSON(apiErr.Status, apiErr)
		// The errors are already logged
		c.Errors = nil
	}
}

// apiErrorFor is the API response to a domain error. Client errors are logged as
// warnings; anything not in the table is logged as a server error and answered with INTERNAL.
var apiErrorFor = map[domain.ErrorCode]response.ApiError{
	domain.InvalidCredentials: {Status: http.StatusUnauthorized, Code: response.CodeInvalidCredentials, Message: "wrong email or password"},
	domain.WrongPassword:      {Status: http.StatusUnprocessableEntity, Code: response.CodeWrongPassword, Message: "wrong current password"},
	domain.PasswordSameAsOld:  {Status: http.StatusUnprocessableEntity, Code: response.CodePasswordSameAsOld, Message: "new password is the same as the current one"},
	domain.RegistrationClosed: {Status: http.StatusConflict, Code: response.CodeRegistrationClosed, Message: "registration is closed: the first account already exists"},
	domain.Forbidden:          {Status: http.StatusForbidden, Code: response.CodeForbidden, Message: "missing a project role, board ownership or service administrator rights"},
	domain.OwnerCannotLeave:   {Status: http.StatusConflict, Code: response.CodeOwnerCannotLeave, Message: "the owner cannot leave the project or board, only delete it"},
	domain.AssigneeNotMember:  {Status: http.StatusUnprocessableEntity, Code: response.CodeAssigneeNotMember, Message: "the assignee is not a project member"},
	domain.LastAdmin:          {Status: http.StatusConflict, Code: response.CodeLastAdmin, Message: "cannot remove the last service administrator"},
	domain.ProjectKeyTaken:    {Status: http.StatusConflict, Code: response.CodeProjectKeyTaken, Message: "the project key is taken by another project"},
	domain.TaskArchived:       {Status: http.StatusConflict, Code: response.CodeTaskArchived, Message: "the task is archived: restore it first"},
	domain.TaskParentInvalid: {Status: http.StatusUnprocessableEntity, Code: response.CodeTaskParentInvalid,
		Message: "a subtask is a task of the same project without subtasks, and its parent is not a subtask"},
	domain.ProjectArchived: {Status: http.StatusConflict, Code: response.CodeProjectArchived, Message: "the project is archived: restore it first"},
	domain.BoardProjectUnavailable: {Status: http.StatusUnprocessableEntity, Code: response.CodeBoardProjectUnavailable,
		Message: "the board owner is not a member of the project"},
	domain.BoardMemberUnavailable: {Status: http.StatusUnprocessableEntity, Code: response.CodeBoardMemberUnavailable,
		Message: "the user shares no project with the board owner"},
	domain.LabelNameTaken: {Status: http.StatusConflict, Code: response.CodeLabelNameTaken,
		Message: "the label name is taken in the project"},
	domain.LabelUnavailable: {Status: http.StatusUnprocessableEntity, Code: response.CodeLabelUnavailable,
		Message: "a label is not of the task's project"},
	domain.CommentEditExpired: {Status: http.StatusConflict, Code: response.CodeCommentEditExpired, Message: "a comment is edited only during the first 24 hours"},
	domain.LinkInvalid:        {Status: http.StatusUnprocessableEntity, Code: response.CodeLinkInvalid, Message: "the link is invalid, used or expired"},
	domain.InvitationAccepted: {Status: http.StatusConflict, Code: response.CodeInvitationAccepted, Message: "an account with this email already exists, sign in instead"},
	domain.MailDisabled:       {Status: http.StatusConflict, Code: response.CodeMailDisabled, Message: "mail is not configured"},
	domain.MailSendFailed:     {Status: http.StatusBadGateway, Code: response.CodeMailSendFailed, Message: "SMTP rejected the message"},
	domain.MailConnectionFailed: {Status: http.StatusBadGateway, Code: response.CodeMailConnectionFailed,
		Message: "could not connect to SMTP, settings not saved"},
	domain.SecretRequired: {Status: http.StatusUnprocessableEntity, Code: response.CodeSecretRequired,
		Message: "the password must be entered again: it is not saved or the host or port changed"},
	domain.FileTooLarge:       {Status: http.StatusUnprocessableEntity, Code: response.CodeFileTooLarge, Message: "the file is too large"},
	domain.FileTypeNotAllowed: {Status: http.StatusUnprocessableEntity, Code: response.CodeFileTypeNotAllowed, Message: "file type not allowed"},

	domain.RefreshTokenNotFound: {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "no session"},
	domain.RefreshTokenWrong:    {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "session is invalid"},
	domain.RefreshTokenRevoked:  {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "session is revoked"},
	domain.RefreshTokenReused:   {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "session is invalid"},
	domain.RefreshTokenExpired:  {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "session expired"},
	domain.AccessTokenNotFound:  {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "sign-in required"},
	domain.AccessTokenWrong:     {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "session is invalid"},
	domain.AccessTokenExpired:   {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "session expired"},
	domain.ParseTokenFailed:     {Status: http.StatusUnauthorized, Code: response.CodeUnauthenticated, Message: "session is invalid"},

	domain.EntityNotFound: {Status: http.StatusNotFound, Code: response.CodeNotFound, Message: "not found"},
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
		// Repository errors without their own code are internal too
		l.Error(string(e.Code), append(args, "error", e.Unwrap())...)
		return internalError()
	}
	if source := e.Unwrap(); source != nil {
		// Why the external service refused, e.g. the SMTP reply, goes to the log for the administrator
		args = append(args, "error", source)
	}
	l.Warn(string(e.Code), args...)
	return &known
}

func internalError() *response.ApiError {
	return response.NewApiErr(http.StatusInternalServerError, response.CodeInternal, "internal server error")
}

// validationError builds details: the key is the field path as in the request JSON (`newPassword`,
// `emails[3]`), the value is what is wrong with it.
func validationError(err error) *response.ApiError {
	apiErr := response.NewApiErr(http.StatusUnprocessableEntity, response.CodeValidationFailed, "validation failed")
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
		apiErr.Message = "cannot parse request body: " + err.Error()
	}
	return apiErr
}

// fieldPath strips the request struct name from the validator path: credentials.email → email.
// Field names come from json tags (Setup registers them in the validator).
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
	case "datetime":
		return "нужна дата ГГГГ-ММ-ДД"
	case "min":
		return fmt.Sprintf("не короче %s", fe.Param())
	case "max":
		return fmt.Sprintf("не длиннее %s", fe.Param())
	case "maxbytes":
		return fmt.Sprintf("не длиннее %s байт в UTF-8", fe.Param())
	case "httpurl":
		return "нужен адрес http(s) без параметров"
	case "mailbox":
		return "нужен адрес почты, например TaskTrail <noreply@example.com>"
	case "projectkey":
		return "2–10 букв и цифр, первая — буква"
	case "required_without":
		return fmt.Sprintf("обязательно, если нет %s", fe.Param())
	default:
		return "недопустимое значение"
	}
}
