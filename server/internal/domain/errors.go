package domain

import (
	"errors"
	"fmt"
	"runtime"
	"strconv"
)

const sourceCodeOffset = 2

type ErrorCode string

const (
	// INVALID_CREDENTIALS: wrong email or password at sign-in
	InvalidCredentials ErrorCode = "INVALID_CREDENTIALS"
	// Wrong current password on password change — 422, not 401: the session is still valid
	WrongPassword      ErrorCode = "WRONG_PASSWORD"
	PasswordSameAsOld  ErrorCode = "PASSWORD_SAME_AS_OLD"
	RegistrationClosed ErrorCode = "REGISTRATION_CLOSED"
	// Missing project role (ADR-0003), board ownership (ADR-0029) or service administrator rights (ADR-0014)
	Forbidden ErrorCode = "FORBIDDEN"
	// The owner does not leave a project or a board but deletes it
	OwnerCannotLeave ErrorCode = "OWNER_CANNOT_LEAVE"
	// The task assignee is not a member of its project
	AssigneeNotMember ErrorCode = "ASSIGNEE_NOT_MEMBER"
	// The project key is taken by another non-deleted project (ADR-0026)
	ProjectKeyTaken ErrorCode = "PROJECT_KEY_TAKEN"
	// The task is archived: only restoring and deleting are allowed (ADR-0027)
	TaskArchived ErrorCode = "TASK_ARCHIVED"
	// The project is archived: it, its members and tasks do not change (ADR-0027)
	ProjectArchived ErrorCode = "PROJECT_ARCHIVED"
	// The board owner is not a member of the project put on the board (ADR-0029)
	BoardProjectUnavailable ErrorCode = "BOARD_PROJECT_UNAVAILABLE"
	// The user added to a board shares no project with the board owner (ADR-0029)
	BoardMemberUnavailable ErrorCode = "BOARD_MEMBER_UNAVAILABLE"
	// The label name is taken in the project ignoring case (ADR-0035)
	LabelNameTaken ErrorCode = "LABEL_NAME_TAKEN"
	// A label is not of the task's project or does not exist (ADR-0035)
	LabelUnavailable ErrorCode = "LABEL_UNAVAILABLE"
	// A comment is edited only during the first 24 hours (ADR-0028)
	CommentEditExpired ErrorCode = "COMMENT_EDIT_EXPIRED"
	// The last service administrator cannot be removed (ADR-0014)
	LastAdmin ErrorCode = "LAST_ADMIN"

	// The invitation or password reset link is invalid, used or expired
	LinkInvalid ErrorCode = "LINK_INVALID"
	// An account with the invitation email already exists: the link leads to sign-in (ADR-0016)
	InvitationAccepted ErrorCode = "INVITATION_ACCEPTED"

	// Mail is not connected (ADR-0017)
	MailDisabled ErrorCode = "MAIL_DISABLED"
	// SMTP did not accept the letter: could not connect, refused sign-in or sending
	MailSendFailed ErrorCode = "MAIL_SEND_FAILED"
	// Mail settings check: could not connect to SMTP or sign in
	MailConnectionFailed ErrorCode = "MAIL_CONNECTION_FAILED"
	// A stored integration secret cannot be read — it must be entered again (ADR-0015)
	SecretRequired ErrorCode = "SECRET_REQUIRED"

	// The file is too large or of a wrong type (ADR-0013)
	FileTooLarge       ErrorCode = "FILE_TOO_LARGE"
	FileTypeNotAllowed ErrorCode = "FILE_TYPE_NOT_ALLOWED"

	RefreshTokenNotFound ErrorCode = "REFRESH_TOKEN_NOT_FOUND"
	RefreshTokenWrong    ErrorCode = "WRONG_REFRESH_TOKEN"
	RefreshTokenRevoked  ErrorCode = "REFRESH_TOKEN_REVOKED"
	// An exchanged token came again after the window for parallel requests — a sign of theft
	RefreshTokenReused  ErrorCode = "REFRESH_TOKEN_REUSED"
	RefreshTokenExpired ErrorCode = "REFRESH_TOKEN_EXPIRED"

	AccessTokenNotFound ErrorCode = "ACCESS_TOKEN_NOT_FOUND"
	AccessTokenWrong    ErrorCode = "WRONG_ACCESS_TOKEN"
	AccessTokenExpired  ErrorCode = "ACCESS_TOKEN_EXPIRED"

	ParseTokenFailed       ErrorCode = "PARSE_TOKEN_FAILED"
	PasswordComapareFailed ErrorCode = "PASSWORD_COMPARE_FAILED"
	PasswordHashingFailed  ErrorCode = "PASSWORD_HASHING_FAILED"

	TokenGenerationFailed ErrorCode = "TOKEN_GENERATION_FAILED"

	// REPO
	EntityNotFound      ErrorCode = "ENTITY_NOT_FOUND"
	EntityAlreadyExists ErrorCode = "ENTITY_ALREADY_EXISTS"
	RepoInternal        ErrorCode = "REPOSITORY_INTERNAL"
	// VALIDATION
	InputValidation ErrorCode = "INPUT_VALIDATION"
)

type DomainError struct {
	Code      ErrorCode
	Metadata  map[string]any
	Source    map[string]string
	sourceErr error
}

func (e *DomainError) Error() string {
	return fmt.Sprintf("code: %s, data: %v", e.Code, e.Metadata)
}

func (e *DomainError) Unwrap() error {
	return e.sourceErr
}

// HasCode reports whether err is a DomainError with code code.
func HasCode(err error, code ErrorCode) bool {
	var e *DomainError
	return errors.As(err, &e) && e.Code == code
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

func ErrInvalidCredentials(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, InvalidCredentials, nil, data...)
}

func ErrWrongPassword(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, WrongPassword, nil, data...)
}

func ErrPasswordSameAsOld(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, PasswordSameAsOld, nil, data...)
}

func ErrRegistrationClosed(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, RegistrationClosed, nil, data...)
}

func ErrForbidden(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, Forbidden, nil, data...)
}

func ErrOwnerCannotLeave(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, OwnerCannotLeave, nil, data...)
}

func ErrAssigneeNotMember(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, AssigneeNotMember, nil, data...)
}

func ErrProjectKeyTaken(sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset, ProjectKeyTaken, sourceErr, data...)
}

func ErrTaskArchived(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, TaskArchived, nil, data...)
}

func ErrProjectArchived(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, ProjectArchived, nil, data...)
}

func ErrBoardProjectUnavailable(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, BoardProjectUnavailable, nil, data...)
}

func ErrBoardMemberUnavailable(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, BoardMemberUnavailable, nil, data...)
}

func ErrLabelNameTaken(sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset, LabelNameTaken, sourceErr, data...)
}

func ErrLabelUnavailable(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, LabelUnavailable, nil, data...)
}

func ErrCommentEditExpired(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, CommentEditExpired, nil, data...)
}

func ErrLastAdmin(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, LastAdmin, nil, data...)
}

func ErrLinkInvalid(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, LinkInvalid, nil, data...)
}

func ErrInvitationAccepted(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, InvitationAccepted, nil, data...)
}

func ErrMailDisabled(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, MailDisabled, nil, data...)
}

func ErrMailSendFailed(sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset, MailSendFailed, sourceErr, data...)
}

func ErrMailConnectionFailed(sourceErr error, data ...any) *DomainError {
	return NewErr(sourceCodeOffset, MailConnectionFailed, sourceErr, data...)
}

func ErrSecretRequired(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, SecretRequired, nil, data...)
}

func ErrFileTooLarge(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, FileTooLarge, nil, data...)
}

func ErrFileTypeNotAllowed(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, FileTypeNotAllowed, nil, data...)
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

// REFRESH TOKEN

func ErrRefreshTokenRevoked(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, RefreshTokenRevoked, nil, data...)
}

func ErrRefreshTokenReused(data ...any) *DomainError {
	return NewErr(sourceCodeOffset, RefreshTokenReused, nil, data...)
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
