package response

// ErrorCode — код ошибки API, значение из ErrorCode в api/openapi.yaml (ADR-0018).
// По коду клиент выбирает реакцию, поэтому новый код сначала добавляется в контракт.
type ErrorCode string

const (
	CodeUnauthenticated    ErrorCode = "UNAUTHENTICATED"
	CodeInvalidCredentials ErrorCode = "INVALID_CREDENTIALS"
	CodeForbidden          ErrorCode = "FORBIDDEN"
	CodeNotFound           ErrorCode = "NOT_FOUND"
	CodeValidationFailed   ErrorCode = "VALIDATION_FAILED"
	CodeRegistrationClosed ErrorCode = "REGISTRATION_CLOSED"
	CodeWrongPassword      ErrorCode = "WRONG_PASSWORD"
	CodePasswordSameAsOld  ErrorCode = "PASSWORD_SAME_AS_OLD"
	CodeLinkInvalid        ErrorCode = "LINK_INVALID"
	CodeInternal           ErrorCode = "INTERNAL"
)

// ApiError — тело любого ответа с ошибкой (ApiError в контракте).
type ApiError struct {
	Status  int       `json:"-"`
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	// Details — поле запроса → что с ним не так; только у VALIDATION_FAILED, иначе null.
	Details map[string]string `json:"details"`
}

func NewApiErr(status int, code ErrorCode, message string) *ApiError {
	return &ApiError{Status: status, Code: code, Message: message}
}
