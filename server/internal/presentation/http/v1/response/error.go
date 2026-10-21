package response

type ErrAPI struct {
	Status   int            `json:"-"`
	Msg      string         `json:"msg,omitempty"`
	Metadata map[string]any `json:"metadata,omitempty"`
}

func NewApiErr(status int, msg string) *ErrAPI {
	return &ErrAPI{Status: status, Msg: msg}
}

func (e *ErrAPI) WithMeta(metadata map[string]any) *ErrAPI {
	e.Metadata = metadata
	return e
}
