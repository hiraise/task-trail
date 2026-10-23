package contract

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const (
	someID   = "8d0c1f0e-6f2a-4b8e-9a1c-0d2e3f4a5b6c"
	someUser = `{"id":"` + someID + `","email":"a@b.c","username":null,"avatarId":null,"isAdmin":true}`
	someTask = `{"id":"` + someID + `","projectId":"` + someID + `","number":1,"key":"DS-1","name":"n","description":null,` +
		`"statusId":"open","priority":"normal","dueDate":null,"authorId":"` + someID + `","assigneeId":null,"archivedAt":null,"projectArchived":false,` +
		`"createdAt":"2026-10-21T10:00:00Z","updatedAt":"2026-10-21T10:00:00.123Z"}`
	someMail = `{"host":"mailpit","port":1025,"encryption":"none","sender":"TaskTrail <a@b.c>",` +
		`"username":null,"passwordSet":false}`
)

const jsonType = "application/json"

// Checks the validator setup: what it lets through and what it catches.
func TestValidate(t *testing.T) {
	v := Load(t)
	cookie := http.Header{"Set-Cookie": {"at=x; Path=/; HttpOnly"}}
	cases := []struct {
		name   string
		method string
		path   string
		status int
		header http.Header
		body   string
		valid  bool
	}{
		{"current user", "GET", "/v1/users/me", 200, nil, someUser, true},
		{"numeric ID instead of UUID", "GET", "/v1/users/me", 200, nil,
			strings.Replace(someUser, someID, "42", 1), false},
		{"invalid email", "GET", "/v1/users/me", 200, nil, strings.Replace(someUser, "a@b.c", "nope", 1), false},
		{"missing required field", "GET", "/v1/users/me", 200, nil,
			strings.Replace(someUser, `"avatarId":null,`, "", 1), false},
		{"extra field", "GET", "/v1/users/me", 200, nil,
			strings.Replace(someUser, `"isAdmin":true`, `"isAdmin":true,"passwordHash":"x"`, 1), false},
		{"status not in the contract", "GET", "/v1/users/me", 409, nil,
			`{"code":"NOT_FOUND","message":"x","details":null}`, false},
		{"wrong response type", "GET", "/v1/users/me", 200, http.Header{"Content-Type": {"text/plain"}}, "ok", false},
		{"error with a code", "GET", "/v1/projects/" + someID, 404, nil,
			`{"code":"NOT_FOUND","message":"project not found","details":null}`, true},
		{"code not in ErrorCode", "GET", "/v1/projects/" + someID, 404, nil,
			`{"code":"NOPE","message":"x","details":null}`, false},
		{"old-format error", "GET", "/v1/projects/" + someID, 500, nil, `{"msg":"internal error"}`, false},
		{"fields in a validation error", "POST", "/v1/auth/password/change", 422, nil,
			`{"code":"VALIDATION_FAILED","message":"x","details":{"newPassword":"слишком короткий"}}`, true},
		{"task after a status change", "PATCH", "/v1/tasks/" + someID + "/status", 200, nil, someTask, true},
		{"only id, as in the old API", "PATCH", "/v1/tasks/" + someID + "/status", 200, nil,
			`{"id":"` + someID + `"}`, false},
		{"time not in UTC", "PATCH", "/v1/tasks/" + someID + "/status", 200, nil,
			strings.Replace(someTask, "10:00:00Z", "13:00:00+03:00", 1), false},
		{"extra field in a list item", "GET", "/v1/projects/" + someID + "/tasks", 200, nil,
			"[" + someTask + "," + strings.Replace(someTask, `"name":"n"`, `"name":"n","permissions":[]`, 1) + "]", false},
		{"role not in the enum", "GET", "/v1/projects/" + someID, 200, nil,
			`{"id":"` + someID + `","name":"p","description":null,"key":"DS","createdAt":"2026-10-21T10:00:00Z",` +
				`"tasksCount":0,"role":"boss"}`, false},
		{"mail not connected", "GET", "/v1/admin/settings", 200, nil,
			`{"serviceUrl":"http://localhost:3000","mail":null}`, true},
		{"mail connected", "GET", "/v1/admin/settings", 200, nil,
			`{"serviceUrl":"https://example.com/tasktrail","mail":` + someMail + `}`, true},
		{"extra field in mail settings", "GET", "/v1/admin/settings", 200, nil,
			`{"serviceUrl":"http://localhost:3000","mail":` + strings.Replace(someMail, `"passwordSet":false`,
				`"passwordSet":true,"password":"secret"`, 1) + `}`, false},
		{"relative service URL", "GET", "/v1/admin/settings", 200, nil,
			`{"serviceUrl":"/tasktrail","mail":null}`, false},
		{"login with cookie", "POST", "/v1/auth/login", 200, cookie, someUser, true},
		{"login without cookie", "POST", "/v1/auth/login", 200, nil, someUser, false},
		{"logout without body", "POST", "/v1/auth/logout", 204, cookie, "", true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			header := http.Header{}
			if c.body != "" {
				header.Set("Content-Type", jsonType)
			}
			for name, values := range c.header {
				header[name] = values
			}
			err := v.validate(httptest.NewRequest(c.method, c.path, nil), c.status, header, []byte(c.body))
			if c.valid && err != nil {
				t.Errorf("expected success: %v", err)
			}
			if !c.valid && err == nil {
				t.Error("expected an error")
			}
		})
	}
}

func TestUnknownRoute(t *testing.T) {
	v := Load(t)
	req := httptest.NewRequest(http.MethodGet, "/v1/access/check", nil)
	if err := v.validate(req, 200, http.Header{}, nil); err == nil {
		t.Error("a path that is not in the contract was accepted")
	}
}

// Check takes headers from the snapshot at WriteHeader time: the client will not receive
// a header set later, and the check must notice it.
func TestCheckUsesWrittenHeaders(t *testing.T) {
	v := Load(t)
	rec := httptest.NewRecorder()
	rec.WriteHeader(http.StatusOK)
	_, _ = rec.WriteString(someUser)
	rec.Header().Set("Content-Type", jsonType)

	inner := &failRecorder{TB: t}
	v.Check(inner, httptest.NewRequest(http.MethodGet, "/v1/users/me", nil), rec)
	if !inner.failed {
		t.Error("Content-Type set after WriteHeader was accepted")
	}
}

// failRecorder records a check failure without failing the test itself.
type failRecorder struct {
	testing.TB
	failed bool
}

func (r *failRecorder) Helper()               {}
func (r *failRecorder) Errorf(string, ...any) { r.failed = true }
