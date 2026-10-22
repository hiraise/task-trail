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

// withIvan creates an administrator and user Ivan from their project; the session is the administrator's.
func withIvan(t *testing.T, s *apitest.Server) (admin, ivan currentUser) {
	t.Helper()
	admin = registerAdmin(t, s)
	// Ivan registers later: the user list is ordered by registration date
	s.Clock.Advance(time.Minute)
	ivan = signUp(t, s, createProject(t, s, "Дизайн-система").Project.ID, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	return admin, ivan
}

// session is a second "browser" on the same server: its own cookies, signed in as email.
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

// mailBody is the PUT /v1/admin/settings/mail body for the SMTP server smtp with fields on top.
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

// The admin section is for the service administrator only: the server checks rights in every
// endpoint (ADR-0014), and a rejection changes nothing.
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
		t.Fatalf("settings changed: %+v", got)
	}
	if n := len(smtp.Messages()); n != 0 {
		t.Fatalf("emails: %d", n)
	}
	rec := asIvan.Do(http.MethodGet, "/v1/users/me", nil)
	if got := apitest.Decode[currentUser](t, rec); got.IsAdmin {
		t.Fatal("Ivan became an administrator")
	}
}

// The service address is saved without a trailing "/", and links are then built from the new address (ADR-0015).
func TestServiceSettings(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	if got := getSettings(t, s); got.ServiceURL != "https://example.com/tasktrail" || got.Mail != nil {
		t.Fatalf("after registration: %+v", got)
	}

	rec := s.Do(http.MethodPatch, "/v1/admin/settings", map[string]string{"serviceUrl": "https://tasks.example.org/"})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[serviceSettings](t, rec); got.ServiceURL != "https://tasks.example.org" || got.Mail != nil {
		t.Fatalf("after change: %+v", got)
	}
	if got := getSettings(t, s); got.ServiceURL != "https://tasks.example.org" {
		t.Fatalf("address not saved: %+v", got)
	}
	rec = s.Do(http.MethodPost, "/v1/admin/users/"+admin.ID+"/password-reset-link", nil)
	apitest.RequireStatus(t, rec, http.StatusCreated)
	if link := apitest.Decode[passwordResetLink](t, rec); !strings.HasPrefix(link.URL, "https://tasks.example.org/auth/reset?token=") {
		t.Fatalf("link not built from the new address: %s", link.URL)
	}

	for body, field := range map[string]string{
		`{}`:                                     "serviceUrl",
		`{"serviceUrl": "ftp://example.com"}`:    "serviceUrl",
		`{"serviceUrl": "https://a.example/?x"}`: "serviceUrl",
		`{"serviceUrl": "https://a.example", "mail": null}`: "mail",
	} {
		apiErr := apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/admin/settings", body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details[field]; !ok {
			t.Errorf("%s: details lack %s: %v", body, field, apiErr.Details)
		}
	}
}

// Mail is enabled only if the SMTP connection succeeds; the test email goes
// to the administrator; disabling deletes the settings (ADR-0017).
func TestMailSettings(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	smtp := smtptest.New(t)

	// SMTP does not respond — settings are not saved
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	closedPort := listener.Addr().(*net.TCPAddr).Port
	_ = listener.Close()
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", mailBody(smtp, map[string]any{"port": closedPort})),
		http.StatusBadGateway, "MAIL_CONNECTION_FAILED")
	if got := getSettings(t, s); got.Mail != nil {
		t.Fatalf("settings saved without a connection: %+v", got.Mail)
	}

	rec := s.Do(http.MethodPut, "/v1/admin/settings/mail", mailBody(smtp, map[string]any{"host": " 127.0.0.1 ", "password": "ignored"}))
	apitest.RequireStatus(t, rec, http.StatusOK)
	want := mailSettings{Host: "127.0.0.1", Port: smtp.Settings().Port, Encryption: "none", Sender: "TaskTrail <noreply@tasktrail.test>"}
	if got := apitest.Decode[serviceSettings](t, rec); got.Mail == nil || *got.Mail != want || got.ServiceURL != "https://example.com/tasktrail" {
		t.Fatalf("after connecting: %+v", got)
	}
	if got := getSettings(t, s); got.Mail == nil || *got.Mail != want {
		t.Fatalf("settings not saved: %+v", got.Mail)
	}
	if got := apitest.Decode[publicSettings](t, s.Do(http.MethodGet, "/v1/settings/public", nil)); !got.MailEnabled {
		t.Fatal("mail not enabled for the web")
	}
	if n := len(smtp.Messages()); n != 0 {
		t.Fatalf("connection check sent emails: %d", n)
	}

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/admin/settings/mail/test", nil), http.StatusNoContent)
	msg := smtp.Last(t)
	if len(msg.To) != 1 || msg.To[0] != "admin@example.com" || msg.Header(t, "Subject") != "Проверка почты TaskTrail" {
		t.Fatalf("test email: to %v, subject %q", msg.To, msg.Header(t, "Subject"))
	}

	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/admin/settings/mail", nil), http.StatusNoContent)
	if got := getSettings(t, s); got.Mail != nil {
		t.Fatalf("after disabling: %+v", got.Mail)
	}
	if got := apitest.Decode[publicSettings](t, s.Do(http.MethodGet, "/v1/settings/public", nil)); got.MailEnabled {
		t.Fatal("mail not disabled for the web")
	}
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/admin/settings/mail/test", nil), http.StatusConflict, "MAIL_DISABLED")
	// Disabling mail that is already disabled is not an error
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/admin/settings/mail", nil), http.StatusNoContent)

	// SMTP stopped accepting mail after saving — the test email reports it
	settings := smtp.Settings()
	settings.Port = closedPort
	s.SaveMail(settings)
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/admin/settings/mail/test", nil), http.StatusBadGateway, "MAIL_SEND_FAILED")
}

// The API never returns the SMTP password; if not entered, the saved one is used, but only for the same host
// and port (ADR-0015).
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
			t.Fatalf("password in the response: %s", rec.Body.String())
		}
		got := apitest.Decode[serviceSettings](t, rec)
		return &got
	}

	// No password saved — it must be entered right away
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", withLogin(nil)), http.StatusUnprocessableEntity, "SECRET_REQUIRED")
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", withLogin(map[string]any{"password": "wrong"})),
		http.StatusBadGateway, "MAIL_CONNECTION_FAILED")

	got := put(withLogin(map[string]any{"password": "smtp-secret"}))
	if got == nil || got.Mail == nil || !got.Mail.PasswordSet || got.Mail.Username == nil || *got.Mail.Username != "robot" {
		t.Fatalf("after connecting: %+v", got)
	}
	// No password — same host and port: SMTP requires login, so the saved password worked
	got = put(withLogin(map[string]any{"sender": "Задачи <tasks@tasktrail.test>"}))
	if got == nil || !got.Mail.PasswordSet || got.Mail.Sender != "Задачи <tasks@tasktrail.test>" {
		t.Fatalf("with the saved password: %+v", got)
	}
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/admin/settings/mail/test", nil), http.StatusNoContent)
	if msg := smtp.Last(t); msg.From != "tasks@tasktrail.test" {
		t.Fatalf("test email from %q", msg.From)
	}

	// Another port — the password is entered again, saved settings do not change
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", withLogin(map[string]any{"port": 2525})),
		http.StatusUnprocessableEntity, "SECRET_REQUIRED")
	if mail := getSettings(t, s).Mail; mail == nil || mail.Port != smtp.Settings().Port || !mail.PasswordSet {
		t.Fatalf("settings after rejection: %+v", mail)
	}
	// A wrong new password does not overwrite the saved one
	apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", withLogin(map[string]any{"password": "wrong"})),
		http.StatusBadGateway, "MAIL_CONNECTION_FAILED")
	if got := put(withLogin(nil)); got == nil {
		t.Fatal("saved password lost after a failed check")
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
		{"no host", map[string]any{"host": ""}, "host"},
		{"port 0", map[string]any{"port": 0}, "port"},
		{"port over 65535", map[string]any{"port": 65536}, "port"},
		{"port as string", map[string]any{"port": "25"}, "port"},
		{"encryption", map[string]any{"encryption": "ssl"}, "encryption"},
		{"sender not an address", map[string]any{"sender": "TaskTrail"}, "sender"},
		{"empty login", map[string]any{"username": ""}, "username"},
		{"empty password", map[string]any{"username": "robot", "password": ""}, "password"},
		{"unknown field", map[string]any{"passwordSet": true}, "passwordSet"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			apiErr := apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", mailBody(smtp, c.fields)),
				http.StatusUnprocessableEntity, "VALIDATION_FAILED")
			if _, ok := apiErr.Details[c.field]; !ok {
				t.Errorf("details lack %s: %v", c.field, apiErr.Details)
			}
		})
	}
	apiErr := apitest.RequireError(t, s.Do(http.MethodPut, "/v1/admin/settings/mail", `{}`), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	for _, field := range []string{"host", "port", "encryption", "sender"} {
		if _, ok := apiErr.Details[field]; !ok {
			t.Errorf("empty body: details lack %s: %v", field, apiErr.Details)
		}
	}
}

// An administrator sees all users, grants and revokes administrator rights; the last one
// cannot be revoked (ADR-0014).
func TestAdminUsers(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin, ivan := withIvan(t, s)

	rec := s.Do(http.MethodGet, "/v1/admin/users", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	users := apitest.Decode[[]adminUser](t, rec)
	if len(users) != 2 || users[0].ID != admin.ID || !users[0].IsAdmin || !users[0].CreatedAt.Equal(apitest.Start) ||
		users[1].ID != ivan.ID || users[1].Email != "ivan@example.com" || users[1].IsAdmin || !users[1].CreatedAt.Equal(apitest.Start.Add(time.Minute)) {
		t.Fatalf("users: %+v", users)
	}

	rec = s.Do(http.MethodPatch, "/v1/admin/users/"+ivan.ID, map[string]bool{"isAdmin": true})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[adminUser](t, rec); got.ID != ivan.ID || !got.IsAdmin {
		t.Fatalf("after granting: %+v", got)
	}
	// Granting again is not an error
	apitest.RequireStatus(t, s.Do(http.MethodPatch, "/v1/admin/users/"+ivan.ID, map[string]bool{"isAdmin": true}), http.StatusOK)

	// The new administrator gets access to the section at once and revokes the previous one
	asIvan := session(t, s, "ivan@example.com")
	if got := apitest.Decode[currentUser](t, asIvan.Do(http.MethodGet, "/v1/users/me", nil)); !got.IsAdmin {
		t.Fatal("Ivan is not an administrator in the profile")
	}
	rec = asIvan.Do(http.MethodPatch, "/v1/admin/users/"+admin.ID, map[string]bool{"isAdmin": false})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[adminUser](t, rec); got.IsAdmin {
		t.Fatalf("after revoking: %+v", got)
	}
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/admin/users", nil), http.StatusForbidden, "FORBIDDEN")

	// You can revoke yourself, but not as the last one
	apitest.RequireError(t, asIvan.Do(http.MethodPatch, "/v1/admin/users/"+ivan.ID, map[string]bool{"isAdmin": false}),
		http.StatusConflict, "LAST_ADMIN")
	if got := apitest.Decode[currentUser](t, asIvan.Do(http.MethodGet, "/v1/users/me", nil)); !got.IsAdmin {
		t.Fatal("the last administrator was revoked")
	}

	apitest.RequireError(t, asIvan.Do(http.MethodPatch, "/v1/admin/users/0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c", map[string]bool{"isAdmin": true}),
		http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, asIvan.Do(http.MethodPatch, "/v1/admin/users/42", map[string]bool{"isAdmin": true}), http.StatusNotFound, "NOT_FOUND")
	for _, body := range []string{`{}`, `{"isAdmin": null}`, `{"isAdmin": "yes"}`} {
		apiErr := apitest.RequireError(t, asIvan.Do(http.MethodPatch, "/v1/admin/users/"+admin.ID, body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details["isAdmin"]; !ok {
			t.Errorf("%s: details lack isAdmin: %v", body, apiErr.Details)
		}
	}
}

// Administrators revoke themselves at the same time — one stays: counting and revoking are under
// a lock (ADR-0014). Without it each would see the other administrators and revoke themselves.
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
		t.Fatalf("responses %v, expected %d × 200 and 1 × 409", got, len(sessions)-1)
	}
	var admins int
	if err := s.Pool.QueryRow(context.Background(), `SELECT count(*) FROM users WHERE is_admin`).Scan(&admins); err != nil || admins != 1 {
		t.Fatalf("administrators: %d, %v", admins, err)
	}
}

// The administrator hands over a user's reset link personally; it works once (ADR-0017).
func TestAdminPasswordResetLink(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	_, ivan := withIvan(t, s)

	rec := s.Do(http.MethodPost, "/v1/admin/users/"+ivan.ID+"/password-reset-link", nil)
	apitest.RequireStatus(t, rec, http.StatusCreated)
	link := apitest.Decode[passwordResetLink](t, rec)
	if !link.ExpiresAt.Equal(apitest.Start.Add(time.Minute + 24*time.Hour)) {
		t.Fatalf("link expiry %s", link.ExpiresAt)
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
