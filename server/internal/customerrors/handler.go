package customerrors

type ErrorHandler interface {
	Conflict(err error, msg string, args ...any) error
	NotFound(err error, msg string, args ...any) error
	InvalidCredentials(err error, msg string, args ...any) error
	InternalTrouble(err error, msg string, args ...any) error
	Unauthorized(err error, msg string, args ...any) error
	Validation(err error) error
	BadRequest(err error, msg string, args ...any) error
	Ok(err error, msg string, args ...any) error
}

type ErrHandler struct {
}

func NewErrHander() *ErrHandler {
	return &ErrHandler{}
}

func (h *ErrHandler) InvalidCredentials(err error, msg string, args ...any) error {
	return newErr(InvalidCredentialsErr, err, msg, nil, args...)
}
func (h *ErrHandler) InternalTrouble(err error, msg string, args ...any) error {
	return newErr(InternalErr, err, msg, nil, args...)
}
func (h *ErrHandler) Unauthorized(err error, msg string, args ...any) error {
	return newErr(UnauthorizedErr, err, msg, nil, args...)
}
func (h *ErrHandler) NotFound(err error, msg string, args ...any) error {
	return newErr(NotFoundErr, err, msg, nil, args...)
}
func (h *ErrHandler) BadRequest(err error, msg string, args ...any) error {
	return newErr(ValidationErr, err, msg, nil, args...)
}
func (h *ErrHandler) Validation(err error) error {
	return newErr(ValidationErr, err, "request validation failed", nil, "error", err)
}
func (h *ErrHandler) Conflict(err error, msg string, args ...any) error {
	return newErr(ConflictErr, err, msg, nil, args...)
}
func (h *ErrHandler) Ok(err error, msg string, args ...any) error {
	return newErr(Ok, err, msg, nil, args...)
}
