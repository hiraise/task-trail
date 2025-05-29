package customerrors

import (
	"fmt"
	"runtime"
	"strconv"
)

type ErrType int

const (
	InvalidCredentialsErr = iota
	UnauthorizedErr
	InternalErr
	ValidationErr
	ConflictErr
	NotFoundErr
	Ok
)

const sourceCodeOffset = 2

type Err struct {
	Type         ErrType
	Msg          string
	ResponseData map[string]any
	Data         []any
	Source       map[string]string
	err          error
}

func (e *Err) Error() string {
	return fmt.Sprintf("msg: %s, type: %d data: %s", e.Msg, e.Type, e.Data)
}

func (e *Err) Unwrap() error {
	return e.err
}

func newErr(t ErrType, sourceErr error, msg string, responseData map[string]any, data ...any) *Err {
	pc, file, line, _ := runtime.Caller(sourceCodeOffset)
	fn := runtime.FuncForPC(pc)
	source := map[string]string{
		"file":     file,
		"function": fn.Name(),
		"line":     strconv.Itoa(line),
	}
	return &Err{Type: t, Msg: msg, err: sourceErr, Data: data, ResponseData: responseData, Source: source}
}
