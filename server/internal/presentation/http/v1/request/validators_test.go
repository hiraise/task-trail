package request_test

import (
	"strings"
	"testing"

	"task-trail/internal/presentation/http/v1/request"

	"github.com/go-playground/validator/v10"
)

func newValidator(t *testing.T) *validator.Validate {
	t.Helper()
	v := validator.New()
	if err := request.RegisterValidators(v); err != nil {
		t.Fatal(err)
	}
	return v
}

// The password limit is 72 bytes in UTF-8, not 72 characters: a Cyrillic letter takes 2 bytes.
func TestMaxBytes(t *testing.T) {
	v := newValidator(t)
	for value, ok := range map[string]bool{
		strings.Repeat("a", 72): true,
		strings.Repeat("a", 73): false,
		strings.Repeat("я", 36): true,
		strings.Repeat("я", 37): false,
	} {
		if err := v.Var(value, "maxbytes=72"); (err == nil) != ok {
			t.Errorf("%d bytes: error %v, expected valid=%v", len(value), err, ok)
		}
	}
}

func TestHTTPURL(t *testing.T) {
	v := newValidator(t)
	for value, ok := range map[string]bool{
		"https://example.com/tasktrail": true,
		"http://localhost:3000":         true,
		"ftp://example.com":             false,
		"example.com":                   false,
		"/tasktrail":                    false,
		"https://":                      false,
		"https://example.com/?a=1":      false,
		"https://example.com/#top":      false,
		"https://user:pass@example.com": false,
	} {
		if err := v.Var(value, "httpurl"); (err == nil) != ok {
			t.Errorf("%q: error %v, expected valid=%v", value, err, ok)
		}
	}
}
