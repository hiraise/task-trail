package domain

import (
	"fmt"
	"runtime"
	"strconv"
)

const sourceCodeOffset = 2

type ErrorCode string

const (
	PasswordNotSet      ErrorCode = "PASSWORD_NOT_SET"
	UserUnverified      ErrorCode = "USER_UNVERIFIED"
	WrongPassword       ErrorCode = "WRONG_PASSWORD"
	WrongEmail          ErrorCode = "WRONG_EMAIL"
	UserAlreadyVerified ErrorCode = "USER_ALREADY_VERIFIED"

	ConfirmationTokenWrong       ErrorCode = "WRONG_CONFIRMATION_TOKEN"
	ConfirmationTokenAlreadyUsed ErrorCode = "CONFIRMATION_TOKEN_ALREADY_USED"
	ConfirmationTokenExpired     ErrorCode = "CONFIRMATION_TOKEN_EXPIRED"

	RefreshTokenNotFound    ErrorCode = "REFRESH_TOKEN_NOT_FOUND"
	RefreshTokenWrong       ErrorCode = "WRONG_REFRESH_TOKEN"
	RefreshTokenAlreadyUsed ErrorCode = "REFRESH_TOKEN_ALREADY_USED"
	RefreshTokenExpired     ErrorCode = "REFRESH_TOKEN_EXPIRED"

	AccessTokenNotFound ErrorCode = "ACCESS_TOKEN_NOT_FOUND"
	AccessTokenWrong    ErrorCode = "WRONG_ACCESS_TOKEN"
	AccessTokenExpired  ErrorCode = "ACCESS_TOKEN_EXPIRED"

	ParseTokenFailed       ErrorCode = "PARSE_TOKEN_FAILED"
	PasswordComapareFailed ErrorCode = "PASSWORD_COMPARE_FAILED"
	PasswordHashingFailed  ErrorCode = "PASSWORD_HASHING_FAILED"

	TokenGenerationFailed ErrorCode = "TOKEN_GENERATION_FAILED"

	EmailAlreadyExists ErrorCode = "EMAIL_ALREADY_EXISTS"
	PasswordSameAsOld  ErrorCode = "PASSWORD_SAME_AS_OLD"

	// REPO
	EntityNotFound      ErrorCode = "ENTITY_NOT_FOUND"
	EntityAlreadyExists ErrorCode = "ENTITY_ALREADY_EXISTS"
	RepoInternal        ErrorCode = "REPOSITORY_INTERNAL"
	// VALIDATION
	InputValidation ErrorCode = "INPUT_VALIDATION"

	// NOTIFICATION
	NotificationFailed ErrorCode = "NOTIFICATION_FAILED"
)

type DomainError struct {
	Code      ErrorCode
	Metadata  map[string]any
	Source    map[string]string
	sourceErr error
}

func (e *DomainError) Error() string {
	return fmt.Sprintf("code: %s, data: %s", e.Code, e.Metadata)
}

func (e *DomainError) Unwrap() error {
	return e.sourceErr
}

func Wrap(err error, background error) error {
	return fmt.Errorf("%w, error: %w", err, background)
}

func NewErr(offset int, t ErrorCode, sourceErr error, metadata ...any) *DomainError {
	var pc [1]uintptr
	runtime.Callers(offset+1, pc[:])
	frame, _ := runtime.CallersFrames(pc[:]).Next()
	source := map[string]string{
		"file":     frame.File,
		"function": frame.Function,
		"line":     strconv.Itoa(frame.Line),
	}
	if len(metadata)%2 != 0 {
		panic("metadata requires even number of arguments")
	}
	m := make(map[string]any, len(metadata)/2)
	for i := 0; i < len(metadata); i += 2 {
		key, ok := metadata[i].(string)
		if !ok {
			panic("metadata key must be string")
		}
		m[key] = metadata[i+1]
	}
	return &DomainError{Code: t, sourceErr: sourceErr, Metadata: m, Source: source}
}

func ErrUserUnverified(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, UserUnverified, nil, data...)
}

func ErrPasswordNotSet(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, PasswordNotSet, nil, data...)
}

func ErrWrongPassword(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, WrongPassword, nil, data...)
}

func ErrWrongEmail(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, WrongEmail, nil, data...)
}
func ErrPasswordCompareFailed(sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset, PasswordComapareFailed, sourceErr, data...)
}
func ErrPasswordHashingFailed(sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset, PasswordHashingFailed, sourceErr, data...)
}

func ErrTokenGenerateFailed(sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset, TokenGenerationFailed, sourceErr, data...)
}

func ErrEmailAlreadyExists(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, EmailAlreadyExists, nil, data...)
}

func ErrEntityNotFound(offset int, sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset+offset, EntityNotFound, sourceErr, data...)
}
func ErrEntityAlreadyExists(offset int, sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset+offset, EntityAlreadyExists, sourceErr, data...)
}

func ErrRepoInternal(offset int, sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset+offset, RepoInternal, sourceErr, data...)
}

func ErrInputValidation(offset int, sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset+offset, InputValidation, sourceErr, data...)
}

// CONFIRMATION

func ErrWrongConfirmationToken(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, ConfirmationTokenWrong, nil, data...)
}

func ErrConfirmationTokenExpired(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, ConfirmationTokenExpired, nil, data...)
}

func ErrConfirmationTokenAlreadyUsed(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, ConfirmationTokenAlreadyUsed, nil, data...)
}

func ErrUserAlreadyVerified(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, UserAlreadyVerified, nil, data...)
}

func ErrPasswordSameAsOld(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, PasswordSameAsOld, nil, data...)
}

// REFRESH TOKEN

func ErrRefreshTokenAlreadyUsed(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, RefreshTokenAlreadyUsed, nil, data...)
}

func ErrRefreshTokenNotFound(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, RefreshTokenNotFound, nil, data...)
}

func ErrRefreshTokenExpired(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, RefreshTokenExpired, nil, data...)
}

func ErrWrongRefreshToken(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, RefreshTokenWrong, nil, data...)
}

// ACCESS TOKEN

func ErrAccessTokenNotFound(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, AccessTokenNotFound, nil, data...)
}

func ErrWrongAccessToken(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, AccessTokenWrong, nil, data...)
}

func ErrAccessTokenExpired(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, AccessTokenExpired, nil, data...)
}

func FailedToParseToken(sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset, ParseTokenFailed, sourceErr, data...)
}

// NOTIFICATION

func ErrNotificationFailed(sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset, NotificationFailed, sourceErr, data...)
}
