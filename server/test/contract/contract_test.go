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
	someTask = `{"id":"` + someID + `","projectId":"` + someID + `","name":"n","description":null,` +
		`"statusId":"open","authorId":"` + someID + `","assigneeId":null,` +
		`"createdAt":"2026-10-21T10:00:00Z","updatedAt":"2026-10-21T10:00:00.123Z"}`
	someMail = `{"host":"mailpit","port":1025,"encryption":"none","sender":"TaskTrail <a@b.c>",` +
		`"username":null,"passwordSet":false}`
)

const jsonType = "application/json"

// Проверяет настройку валидатора: что он пропускает и что ловит.
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
		{"текущий пользователь", "GET", "/v1/users/me", 200, nil, someUser, true},
		{"числовой ID вместо UUID", "GET", "/v1/users/me", 200, nil,
			strings.Replace(someUser, someID, "42", 1), false},
		{"неверная почта", "GET", "/v1/users/me", 200, nil, strings.Replace(someUser, "a@b.c", "nope", 1), false},
		{"нет обязательного поля", "GET", "/v1/users/me", 200, nil,
			strings.Replace(someUser, `"avatarId":null,`, "", 1), false},
		{"лишнее поле", "GET", "/v1/users/me", 200, nil,
			strings.Replace(someUser, `"isAdmin":true`, `"isAdmin":true,"passwordHash":"x"`, 1), false},
		{"статус не из контракта", "GET", "/v1/users/me", 409, nil,
			`{"code":"NOT_FOUND","message":"x","details":null}`, false},
		{"не тот тип ответа", "GET", "/v1/users/me", 200, http.Header{"Content-Type": {"text/plain"}}, "ok", false},
		{"ошибка с кодом", "GET", "/v1/projects/" + someID, 404, nil,
			`{"code":"NOT_FOUND","message":"нет проекта","details":null}`, true},
		{"код не из ErrorCode", "GET", "/v1/projects/" + someID, 404, nil,
			`{"code":"NOPE","message":"x","details":null}`, false},
		{"ошибка старого формата", "GET", "/v1/projects/" + someID, 500, nil, `{"msg":"internal error"}`, false},
		{"поля в ошибке проверки", "POST", "/v1/auth/password/change", 422, nil,
			`{"code":"VALIDATION_FAILED","message":"x","details":{"newPassword":"слишком короткий"}}`, true},
		{"задача после смены статуса", "PATCH", "/v1/tasks/" + someID + "/status", 200, nil, someTask, true},
		{"только id, как в старом API", "PATCH", "/v1/tasks/" + someID + "/status", 200, nil,
			`{"id":"` + someID + `"}`, false},
		{"время не в UTC", "PATCH", "/v1/tasks/" + someID + "/status", 200, nil,
			strings.Replace(someTask, "10:00:00Z", "13:00:00+03:00", 1), false},
		{"лишнее поле в элементе списка", "GET", "/v1/projects/" + someID + "/tasks", 200, nil,
			"[" + someTask + "," + strings.Replace(someTask, `"name":"n"`, `"name":"n","permissions":[]`, 1) + "]", false},
		{"роль не из перечня", "GET", "/v1/projects/" + someID, 200, nil,
			`{"id":"` + someID + `","name":"p","description":null,"createdAt":"2026-10-21T10:00:00Z",` +
				`"tasksCount":0,"role":"boss"}`, false},
		{"почта не подключена", "GET", "/v1/admin/settings", 200, nil,
			`{"serviceUrl":"http://localhost:3000","mail":null}`, true},
		{"почта подключена", "GET", "/v1/admin/settings", 200, nil,
			`{"serviceUrl":"https://example.com/tasktrail","mail":` + someMail + `}`, true},
		{"лишнее поле в настройках почты", "GET", "/v1/admin/settings", 200, nil,
			`{"serviceUrl":"http://localhost:3000","mail":` + strings.Replace(someMail, `"passwordSet":false`,
				`"passwordSet":true,"password":"secret"`, 1) + `}`, false},
		{"относительный адрес сервиса", "GET", "/v1/admin/settings", 200, nil,
			`{"serviceUrl":"/tasktrail","mail":null}`, false},
		{"вход с cookie", "POST", "/v1/auth/login", 200, cookie, someUser, true},
		{"вход без cookie", "POST", "/v1/auth/login", 200, nil, someUser, false},
		{"выход без тела", "POST", "/v1/auth/logout", 204, cookie, "", true},
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
				t.Errorf("ожидался успех: %v", err)
			}
			if !c.valid && err == nil {
				t.Error("ожидалась ошибка")
			}
		})
	}
}

func TestUnknownRoute(t *testing.T) {
	v := Load(t)
	req := httptest.NewRequest(http.MethodGet, "/v1/access/check", nil)
	if err := v.validate(req, 200, http.Header{}, nil); err == nil {
		t.Error("путь, которого нет в контракте, принят")
	}
}

// Check берёт заголовки из снимка на момент WriteHeader: поставленный позже заголовок
// клиент не получит, и проверка должна это заметить.
func TestCheckUsesWrittenHeaders(t *testing.T) {
	v := Load(t)
	rec := httptest.NewRecorder()
	rec.WriteHeader(http.StatusOK)
	_, _ = rec.WriteString(someUser)
	rec.Header().Set("Content-Type", jsonType)

	inner := &failRecorder{TB: t}
	v.Check(inner, httptest.NewRequest(http.MethodGet, "/v1/users/me", nil), rec)
	if !inner.failed {
		t.Error("Content-Type, поставленный после WriteHeader, принят")
	}
}

// failRecorder запоминает провал проверки, не роняя сам тест.
type failRecorder struct {
	testing.TB
	failed bool
}

func (r *failRecorder) Helper()               {}
func (r *failRecorder) Errorf(string, ...any) { r.failed = true }
