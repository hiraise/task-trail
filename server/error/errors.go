package customerrors

import (
	"fmt"
	"net/http"
)

type ErrBase struct {
	Status   int            `json:"-"`
	Msg      string         `json:"msg,omitempty"`
	Metadata map[string]any `json:"metadata,omitempty"`
}

func (e *ErrBase) Error() string {
	return fmt.Sprintf("msg: %s, status: %d metadata: %s", e.Msg, e.Status, e.Metadata)
}

func NewErrBase(msg string, metadata map[string]any) *ErrBase {
	return &ErrBase{Msg: msg, Metadata: metadata}
}

func NewErrNotFound(metadata map[string]any) *ErrBase {
	return &ErrBase{Msg: "entity not found", Metadata: metadata, Status: http.StatusNotFound}
}

func NewErrConflict(metadata map[string]any) *ErrBase {
	return &ErrBase{Msg: "entity already exists", Metadata: metadata, Status: http.StatusConflict}
}

func NewErrInvalidCredentials(metadata map[string]any) *ErrBase {
	return &ErrBase{Msg: "invalid credentials", Metadata: metadata, Status: http.StatusUnauthorized}
}

func NewErrUnauthorized(metadata map[string]any) *ErrBase {
	return &ErrBase{Msg: "Unauthorized", Metadata: metadata, Status: http.StatusUnauthorized}
}

func NewErrInternal(metadata map[string]any) *ErrBase {
	return &ErrBase{Msg: "internal error", Metadata: metadata, Status: http.StatusInternalServerError}
}
