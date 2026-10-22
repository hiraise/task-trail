package v1_test

import (
	"context"
	"maps"
	"net"
	"net/http"
	"net/http/cookiejar"
	"strings"
	"sync"
	"testing"
	"time"

	"task-trail/internal/app"
	"task-trail/test/apitest"
	"task-trail/test/contract"
	"task-trail/test/smtptest"
)

type serviceSettings struct {
	ServiceURL string        `json:"serviceUrl"`
	Mail       *mailSettings `json:"mail"`
}

type mailSettings struct {
	Host        string  `json:"host"`
	Port        int     `json:"port"`
	Encryption  string  `json:"encryption"`
	Sender      string  `json:"sender"`
	Username    *string `json:"username"`
	PasswordSet bool    `json:"passwordSet"`
}

type adminUser struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	IsAdmin   bool      `json:"isAdmin"`
	CreatedAt time.Time `json:"createdAt"`
}

type passwordResetLink struct {
	URL       string    `json:"url"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// withIvan создаёт администратора и пользователя Ивана из его проекта; сессия — у администратора.
func withIvan(t *testing.T, s *apitest.Server) (admin, ivan currentUser) {
	t.Helper()
	admin = registerAdmin(t, s)
	// Иван зарегистрирован позже: список пользователей — по дате регистрации
	s.Clock.Advance(time.Minute)
	ivan = signUp(t, s, createProject(t, s, "Дизайн-система").Project.ID, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	return admin, ivan
}

// session — второй «браузер» на том же сервере: свои cookie, вход под email.
func session(t *testing.T, s *apitest.Server, email string) *apitest.Server {
	t.Helper()
	other := *s
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	other.Jar = jar
	login(t, &other, email, password)
	return &other
}

// mailBody — тело PUT /v1/admin/settings/mail для SMTP-сервера smtp с полями fields поверх.
func mailBody(smtp *smtptest.Server, fields map[string]any) map[string]any {
	settings := smtp.Settings()
	body := map[string]any{
		"host":       settings.Host,
		"port":       settings.Port,
		"encryption": string(settings.Encryption),
		"sender":     "TaskTrail <noreply@tasktrail.test>",
	}
	maps.Copy(body, fields)
	return body
}

func getSettings(t *testing.T, s *apitest.Server) serviceSettings {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/admin/settings", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[serviceSettings](t, rec)
}

// Раздел администратора — только администратору сервиса: права проверяет сервер в каждом
// эндпоинте (ADR-0014), отказ ничего не меняет.
func TestAdminOnly(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin, ivan := withIvan(t, s)
	smtp := smtptest.New(t)
	endpoints := []struct {
		method, path string
		body         any
	}{
		{http.MethodGet, "/v1/admin/settings", nil},
		{http.MethodPatch, "/v1/admin/settings", map[string]string{"serviceUrl": "https://evil.example.com"}},
		{http.MethodPut, "/v1/admin/settings/mail", mailBody(smtp, nil)},
		{http.MethodDelete, "/v1/admin/settings/mail", nil},
		{http.MethodPost, "/v1/admin/settings/mail/test", nil},
		{http.MethodGet, "/v1/admin/users", nil},
		{http.MethodPatch, "/v1/admin/users/" + ivan.ID, map[string]bool{"isAdmin": true}},
		{http.MethodPost, "/v1/admin/users/" + admin.ID + "/password-reset-link", nil},
	}
	asIvan := session(t, s, "ivan@example.com")
	anonymous(t, s)
	for _, e := range endpoints {
		apitest.RequireError(t, asIvan.Do(e.method, e.path, e.body), http.StatusForbidden, "FORBIDDEN")
		apitest.RequireError(t, s.Do(e.method, e.path, e.body), http.StatusUnauthorized, "UNAUTHENTICATED")
	}

	login(t, s, "admin@example.com", password)
	if got := getSettings(t, s); got.ServiceURL != "https://example.com/tasktrail" || got.Mail != nil {
		t.Fatalf("настройки изменились: %+v", got)
	}
	if n := len(smtp.Messages()); n != 0 {
		t.Fatalf("писем: %d", n)
	}
	rec := asIvan.Do(http.MethodGet, "/v1/users/me", nil)
	if got := apitest.Decode[currentUser](t, rec); got.IsAdmin {
		t.Fatal("Иван стал администратором")
	}
}

// Адрес сервиса сохраняется без «/» в конце, и ссылки дальше строятся от нового адреса (ADR-0015).
func TestServiceSettings(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	if got := getSettings(t, s); got.ServiceURL != "https://example.com/tasktrail" || got.Mail != nil {
		t.Fatalf("после регистрации: %+v", got)
	}

	rec := s.Do(http.MethodPatch, "/v1/admin/settings", map[string]string{"serviceUrl": "https://tasks.example.org/"})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[serviceSettings](t, rec); got.ServiceURL != "https://tasks.example.org" || got.Mail != nil {
		t.Fatalf("после изменения: %+v", got)
	}
	if got := getSettings(t, s); got.ServiceURL != "https://tasks.example.org" {
		t.Fatalf("адрес не сохранился: %+v", got)
	}
	rec = s.Do(http.MethodPost, "/v1/admin/users/"+admin.ID+"/password-reset-link", nil)
	apitest.RequireStatus(t, rec, http.StatusCreated)
	if link := apitest.Decode[passwordResetLink](t, rec); !strings.HasPrefix(link.URL, "https://tasks.example.org/auth/reset?token=") {
		t.Fatalf("ссылка не от нового адреса: %s", link.URL)
	}

	for body, field := range map[string]string{
		`{}`:                                     "serviceUrl",
		`{"serviceUrl": "ftp://example.com"}`:    "serviceUrl",
		`{"serviceUrl": "https://a.example/?x"}`: "serviceUrl",
		`{"serviceUrl": "https://a.example", "mail": null}`: "mail",
	} {
		apiErr := apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/admin/settings", body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details[field]; !ok {
			t.Errorf("%s: в details нет %s: %v", body, field, apiErr.Details)
		}
	}
}

// Почта включается, только если к SMTP удалось подключиться; тестовое письмо уходит
// администратору; отключение удаляет настройки (ADR-0017).
func TestMailSettings(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	smtp := smtptest.New(t)

	// SMTP не отвечает — настройки не сохраняются
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	closedPort := listener.Addr().(*net.TCPAddr).Port
	_ = listener.Close()
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", mailBody(smtp, map[string]any{"port": closedPort})),
		http.StatusBadGateway, "MAIL_CONNECTION_FAILED")
	if got := getSettings(t, s); got.Mail != nil {
		t.Fatalf("настройки сохранены без подключения: %+v", got.Mail)
	}

	rec := s.Do(http.MethodPut, "/v1/admin/settings/mail", mailBody(smtp, map[string]any{"host": " 127.0.0.1 ", "password": "ignored"}))
	apitest.RequireStatus(t, rec, http.StatusOK)
	want := mailSettings{Host: "127.0.0.1", Port: smtp.Settings().Port, Encryption: "none", Sender: "TaskTrail <noreply@tasktrail.test>"}
	if got := apitest.Decode[serviceSettings](t, rec); got.Mail == nil || *got.Mail != want || got.ServiceURL != "https://example.com/tasktrail" {
		t.Fatalf("после подключения: %+v", got)
	}
	if got := getSettings(t, s); got.Mail == nil || *got.Mail != want {
		t.Fatalf("настройки не сохранились: %+v", got.Mail)
	}
	if got := apitest.Decode[publicSettings](t, s.Do(http.MethodGet, "/v1/settings/public", nil)); !got.MailEnabled {
		t.Fatal("почта не включилась для веба")
	}
	if n := len(smtp.Messages()); n != 0 {
		t.Fatalf("проверка подключения отправила писем: %d", n)
	}

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/admin/settings/mail/test", nil), http.StatusNoContent)
	msg := smtp.Last(t)
	if len(msg.To) != 1 || msg.To[0] != "admin@example.com" || msg.Header(t, "Subject") != "Проверка почты TaskTrail" {
		t.Fatalf("тестовое письмо: кому %v, тема %q", msg.To, msg.Header(t, "Subject"))
	}

	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/admin/settings/mail", nil), http.StatusNoContent)
	if got := getSettings(t, s); got.Mail != nil {
		t.Fatalf("после отключения: %+v", got.Mail)
	}
	if got := apitest.Decode[publicSettings](t, s.Do(http.MethodGet, "/v1/settings/public", nil)); got.MailEnabled {
		t.Fatal("почта не выключилась для веба")
	}
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/admin/settings/mail/test", nil), http.StatusConflict, "MAIL_DISABLED")
	// Отключать отключённую почту — не ошибка
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/admin/settings/mail", nil), http.StatusNoContent)

	// SMTP перестал принимать письма после сохранения — тестовое письмо сообщает об этом
	settings := smtp.Settings()
	settings.Port = closedPort
	s.SaveMail(settings)
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/admin/settings/mail/test", nil), http.StatusBadGateway, "MAIL_SEND_FAILED")
}

// Пароль SMTP API не отдаёт; не введён — берётся сохранённый, но только для того же сервера
// и порта (ADR-0015).
func TestMailPassword(t *testing.T) {
	smtp := smtptest.New(t, smtptest.WithSTARTTLS(), smtptest.WithAuth("robot", "smtp-secret"))
	s := apitest.New(t, contract.Load(t), app.WithSMTPRootCAs(smtp.RootCAs))
	registerAdmin(t, s)
	withLogin := func(fields map[string]any) map[string]any {
		all := map[string]any{"username": "robot"}
		maps.Copy(all, fields)
		return mailBody(smtp, all)
	}
	put := func(body map[string]any) *serviceSettings {
		t.Helper()
		rec := s.Do(http.MethodPut, "/v1/admin/settings/mail", body)
		if rec.Code != http.StatusOK {
			return nil
		}
		if strings.Contains(rec.Body.String(), "smtp-secret") {
			t.Fatalf("пароль в ответе: %s", rec.Body.String())
		}
		got := apitest.Decode[serviceSettings](t, rec)
		return &got
	}

	// Пароль не сохранён — ввести его нужно сразу
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", withLogin(nil)), http.StatusUnprocessableEntity, "SECRET_REQUIRED")
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", withLogin(map[string]any{"password": "wrong"})),
		http.StatusBadGateway, "MAIL_CONNECTION_FAILED")

	got := put(withLogin(map[string]any{"password": "smtp-secret"}))
	if got == nil || got.Mail == nil || !got.Mail.PasswordSet || got.Mail.Username == nil || *got.Mail.Username != "robot" {
		t.Fatalf("после подключения: %+v", got)
	}
	// Без пароля — тот же сервер и порт: SMTP требует вход, значит, сохранённый пароль сработал
	got = put(withLogin(map[string]any{"sender": "Задачи <tasks@tasktrail.test>"}))
	if got == nil || !got.Mail.PasswordSet || got.Mail.Sender != "Задачи <tasks@tasktrail.test>" {
		t.Fatalf("с сохранённым паролем: %+v", got)
	}
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/admin/settings/mail/test", nil), http.StatusNoContent)
	if msg := smtp.Last(t); msg.From != "tasks@tasktrail.test" {
		t.Fatalf("тестовое письмо от %q", msg.From)
	}

	// Другой порт — пароль вводится заново, сохранённые настройки не меняются
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", withLogin(map[string]any{"port": 2525})),
		http.StatusUnprocessableEntity, "SECRET_REQUIRED")
	if mail := getSettings(t, s).Mail; mail == nil || mail.Port != smtp.Settings().Port || !mail.PasswordSet {
		t.Fatalf("настройки после отказа: %+v", mail)
	}
	// Неверный новый пароль не затирает сохранённый
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", withLogin(map[string]any{"password": "wrong"})),
		http.StatusBadGateway, "MAIL_CONNECTION_FAILED")
	if got := put(withLogin(nil)); got == nil {
		t.Fatal("сохранённый пароль потерян после неудачной проверки")
	}
}

func TestMailSettingsValidation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	smtp := smtptest.New(t)
	cases := []struct {
		name   string
		fields map[string]any
		field  string
	}{
		{"нет сервера", map[string]any{"host": ""}, "host"},
		{"порт 0", map[string]any{"port": 0}, "port"},
		{"порт больше 65535", map[string]any{"port": 65536}, "port"},
		{"порт строкой", map[string]any{"port": "25"}, "port"},
		{"шифрование", map[string]any{"encryption": "ssl"}, "encryption"},
		{"отправитель не адрес", map[string]any{"sender": "TaskTrail"}, "sender"},
		{"пустой логин", map[string]any{"username": ""}, "username"},
		{"пустой пароль", map[string]any{"username": "robot", "password": ""}, "password"},
		{"лишнее поле", map[string]any{"passwordSet": true}, "passwordSet"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			apiErr := apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", mailBody(smtp, c.fields)),
				http.StatusUnprocessableEntity, "VALIDATION_FAILED")
			if _, ok := apiErr.Details[c.field]; !ok {
				t.Errorf("в details нет %s: %v", c.field, apiErr.Details)
			}
		})
	}
	apiErr := apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", `{}`), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	for _, field := range []string{"host", "port", "encryption", "sender"} {
		if _, ok := apiErr.Details[field]; !ok {
			t.Errorf("пустое тело: в details нет %s: %v", field, apiErr.Details)
		}
	}
}

// Администратор видит всех пользователей, назначает и снимает администраторов; последнего
// снять нельзя (ADR-0014).
func TestAdminUsers(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin, ivan := withIvan(t, s)

	rec := s.Do(http.MethodGet, "/v1/admin/users", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	users := apitest.Decode[[]adminUser](t, rec)
	if len(users) != 2 || users[0].ID != admin.ID || !users[0].IsAdmin || !users[0].CreatedAt.Equal(apitest.Start) ||
		users[1].ID != ivan.ID || users[1].Email != "ivan@example.com" || users[1].IsAdmin || !users[1].CreatedAt.Equal(apitest.Start.Add(time.Minute)) {
		t.Fatalf("пользователи: %+v", users)
	}

	rec = s.Do(http.MethodPatch, "/v1/admin/users/"+ivan.ID, map[string]bool{"isAdmin": true})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[adminUser](t, rec); got.ID != ivan.ID || !got.IsAdmin {
		t.Fatalf("после назначения: %+v", got)
	}
	// Повторное назначение — не ошибка
	apitest.RequireStatus(t, s.Do(http.MethodPatch, "/v1/admin/users/"+ivan.ID, map[string]bool{"isAdmin": true}), http.StatusOK)

	// Новый администратор сразу получает доступ к разделу и снимает прежнего
	asIvan := session(t, s, "ivan@example.com")
	if got := apitest.Decode[currentUser](t, asIvan.Do(http.MethodGet, "/v1/users/me", nil)); !got.IsAdmin {
		t.Fatal("в профиле Иван не администратор")
	}
	rec = asIvan.Do(http.MethodPatch, "/v1/admin/users/"+admin.ID, map[string]bool{"isAdmin": false})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[adminUser](t, rec); got.IsAdmin {
		t.Fatalf("после снятия: %+v", got)
	}
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/admin/users", nil), http.StatusForbidden, "FORBIDDEN")

	// Себя снять можно, но не последним
	apitest.RequireError(t, asIvan.Do(http.MethodPatch, "/v1/admin/users/"+ivan.ID, map[string]bool{"isAdmin": false}),
		http.StatusConflict, "LAST_ADMIN")
	if got := apitest.Decode[currentUser](t, asIvan.Do(http.MethodGet, "/v1/users/me", nil)); !got.IsAdmin {
		t.Fatal("последний администратор снят")
	}

	apitest.RequireError(t, asIvan.Do(http.MethodPatch, "/v1/admin/users/0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c", map[string]bool{"isAdmin": true}),
		http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, asIvan.Do(http.MethodPatch, "/v1/admin/users/42", map[string]bool{"isAdmin": true}), http.StatusNotFound, "NOT_FOUND")
	for _, body := range []string{`{}`, `{"isAdmin": null}`, `{"isAdmin": "yes"}`} {
		apiErr := apitest.RequireError(t, asIvan.Do(http.MethodPatch, "/v1/admin/users/"+admin.ID, body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details["isAdmin"]; !ok {
			t.Errorf("%s: в details нет isAdmin: %v", body, apiErr.Details)
		}
	}
}

// Администраторы одновременно снимают сами себя — один остаётся: подсчёт и снятие — под
// блокировкой (ADR-0014). Без неё каждый увидел бы других администраторов и снялся бы.
func TestLastAdminRace(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	ids := map[string]string{"admin@example.com": admin.ID}
	created := createProject(t, s, "Дизайн-система", "anna@example.com", "boris@example.com", "vera@example.com", "gleb@example.com")
	for _, invitation := range created.Invitations {
		rec := s.Do(http.MethodPost, "/v1/auth/invitations/accept", acceptBody(inviteToken(t, *invitation.InviteURL)))
		apitest.RequireStatus(t, rec, http.StatusCreated)
		ids[invitation.Email] = apitest.Decode[currentUser](t, rec).ID
	}
	login(t, s, "admin@example.com", password)
	sessions := map[string]*apitest.Server{}
	for email, id := range ids {
		apitest.RequireStatus(t, s.Do(http.MethodPatch, "/v1/admin/users/"+id, map[string]bool{"isAdmin": true}), http.StatusOK)
		sessions[id] = session(t, s, email)
	}

	codes := make(chan int, len(sessions))
	var wg sync.WaitGroup
	for id, own := range sessions {
		wg.Add(1)
		go func() {
			defer wg.Done()
			codes <- own.Do(http.MethodPatch, "/v1/admin/users/"+id, map[string]bool{"isAdmin": false}).Code
		}()
	}
	wg.Wait()
	close(codes)
	got := map[int]int{}
	for code := range codes {
		got[code]++
	}
	if got[http.StatusOK] != len(sessions)-1 || got[http.StatusConflict] != 1 {
		t.Fatalf("ответы %v, ожидались %d × 200 и 1 × 409", got, len(sessions)-1)
	}
	var admins int
	if err := s.Pool.QueryRow(context.Background(), `SELECT count(*) FROM users WHERE is_admin`).Scan(&admins); err != nil || admins != 1 {
		t.Fatalf("администраторов: %d, %v", admins, err)
	}
}

// Ссылку сброса для пользователя администратор передаёт сам; она работает один раз (ADR-0017).
func TestAdminPasswordResetLink(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	_, ivan := withIvan(t, s)

	rec := s.Do(http.MethodPost, "/v1/admin/users/"+ivan.ID+"/password-reset-link", nil)
	apitest.RequireStatus(t, rec, http.StatusCreated)
	link := apitest.Decode[passwordResetLink](t, rec)
	if !link.ExpiresAt.Equal(apitest.Start.Add(time.Minute + 24*time.Hour)) {
		t.Fatalf("срок ссылки %s", link.ExpiresAt)
	}
	token := resetLink(t, link.URL)

	anonymous(t, s)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/reset", map[string]string{"token": token, "password": newPassword}), http.StatusNoContent)
	login(t, s, "ivan@example.com", newPassword)
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/reset", map[string]string{"token": token, "password": "password-3"}),
		http.StatusUnprocessableEntity, "LINK_INVALID")

	login(t, s, "admin@example.com", password)
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/admin/users/0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c/password-reset-link", nil),
		http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/admin/users/42/password-reset-link", nil), http.StatusNotFound, "NOT_FOUND")
}
