package response

// ErrorCode is an API error code, a value of ErrorCode in api/openapi.yaml (ADR-0018).
// The client chooses its reaction by the code, so a new code is added to the contract first.
type ErrorCode string

const (
	CodeUnauthenticated      ErrorCode = "UNAUTHENTICATED"
	CodeInvalidCredentials   ErrorCode = "INVALID_CREDENTIALS"
	CodeForbidden            ErrorCode = "FORBIDDEN"
	CodeNotFound             ErrorCode = "NOT_FOUND"
	CodeValidationFailed     ErrorCode = "VALIDATION_FAILED"
	CodeRegistrationClosed   ErrorCode = "REGISTRATION_CLOSED"
	CodeWrongPassword        ErrorCode = "WRONG_PASSWORD"
	CodePasswordSameAsOld    ErrorCode = "PASSWORD_SAME_AS_OLD"
	CodeLinkInvalid          ErrorCode = "LINK_INVALID"
	CodeInvitationAccepted   ErrorCode = "INVITATION_ACCEPTED"
	CodeOwnerCannotLeave     ErrorCode = "OWNER_CANNOT_LEAVE"
	CodeAssigneeNotMember    ErrorCode = "ASSIGNEE_NOT_MEMBER"
	CodeLastAdmin            ErrorCode = "LAST_ADMIN"
	CodeProjectKeyTaken      ErrorCode = "PROJECT_KEY_TAKEN"
	CodeTaskArchived         ErrorCode = "TASK_ARCHIVED"
	CodeProjectArchived      ErrorCode = "PROJECT_ARCHIVED"
	CodeCommentEditExpired   ErrorCode = "COMMENT_EDIT_EXPIRED"
	CodeMailDisabled         ErrorCode = "MAIL_DISABLED"
	CodeMailSendFailed       ErrorCode = "MAIL_SEND_FAILED"
	CodeMailConnectionFailed ErrorCode = "MAIL_CONNECTION_FAILED"
	CodeSecretRequired       ErrorCode = "SECRET_REQUIRED"
	CodeFileTooLarge         ErrorCode = "FILE_TOO_LARGE"
	CodeFileTypeNotAllowed   ErrorCode = "FILE_TYPE_NOT_ALLOWED"
	CodeInternal             ErrorCode = "INTERNAL"
)

// ApiError is the body of any error response (ApiError in the contract).
type ApiError struct {
	Status  int       `json:"-"`
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	// Details maps a request field → what is wrong with it; only for VALIDATION_FAILED, otherwise null.
	Details map[string]string `json:"details"`
}

func NewApiErr(status int, code ErrorCode, message string) *ApiError {
	return &ApiError{Status: status, Code: code, Message: message}
}
