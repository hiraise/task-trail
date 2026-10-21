package v1_test

import (
	"context"
	"net/http"
	"net/url"
	"reflect"
	"strings"
	"sync"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
	"task-trail/test/apitest"
	"task-trail/test/contract"
)

const password = "password-1"

type currentUser struct {
	ID       string  `json:"id"`
	Email    string  `json:"email"`
	Username *string `json:"username"`
	AvatarID *string `json:"avatarId"`
	IsAdmin  bool    `json:"isAdmin"`
}

type publicSettings struct {
	RegistrationOpen bool `json:"registrationOpen"`
	MailEnabled      bool `json:"mailEnabled"`
}

func registerBody(email string) map[string]string {
	return map[string]string{
		"email":      email,
		"password":   password,
		"username":   "Админ",
		"serviceUrl": "https://example.com/tasktrail/",
	}
}

// registerAdmin создаёт первый аккаунт; сессия остаётся в cookie сервера s.
func registerAdmin(t *testing.T, s *apitest.Server) currentUser {
	t.Helper()
	rec := s.Do(http.MethodPost, "/v1/auth/register", registerBody("admin@example.com"))
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[currentUser](t, rec)
}

func login(t *testing.T, s *apitest.Server, email, pwd string) {
	t.Helper()
	rec := s.Do(http.MethodPost, "/v1/auth/login", map[string]string{"email": email, "password": pwd})
	apitest.RequireStatus(t, rec, http.StatusOK)
}

func rtCookie(value string) *http.Cookie { return &http.Cookie{Name: "rt", Value: value} }

// Пока пользователей нет, регистрация открыта; первый аккаунт — администратор, сразу входит,
// почта приводится к норме, адрес сервиса сохраняется. Второй регистрации нет (ADR-0016).
func TestRegisterFirstAccount(t *testing.T) {
	s := apitest.New(t, contract.Load(t))

	rec := s.Do(http.MethodGet, "/v1/settings/public", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[publicSettings](t, rec); got != (publicSettings{RegistrationOpen: true}) {
		t.Fatalf("настройки до регистрации: %+v", got)
	}

	rec = s.Do(http.MethodPost, "/v1/auth/register", registerBody("  Admin@Example.COM "))
	apitest.RequireStatus(t, rec, http.StatusCreated)
	user := apitest.Decode[currentUser](t, rec)
	if user.Email != "admin@example.com" || !user.IsAdmin || user.Username == nil || *user.Username != "Админ" || user.AvatarID != nil {
		t.Fatalf("пользователь: %+v", user)
	}
	if s.Cookie("at", "/v1/projects") == "" || s.Cookie("rt", "/v1/auth/refresh") == "" {
		t.Fatal("после регистрации нет cookie сессии")
	}
	if s.Cookie("rt", "/v1/projects") != "" {
		t.Fatal("refresh-токен уходит не только эндпоинтам доступа")
	}
	apitest.RequireStatus(t, s.Do(http.MethodGet, "/v1/auth/check", nil), http.StatusNoContent)

	var serviceURL string
	if err := s.Pool.QueryRow(context.Background(), `SELECT value->>'serviceUrl' FROM settings WHERE key = 'service'`).Scan(&serviceURL); err != nil {
		t.Fatal(err)
	}
	if serviceURL != "https://example.com/tasktrail" {
		t.Fatalf("адрес сервиса %q", serviceURL)
	}

	rec = s.Do(http.MethodGet, "/v1/settings/public", nil)
	if got := apitest.Decode[publicSettings](t, rec); got.RegistrationOpen {
		t.Fatalf("регистрация открыта после первого аккаунта: %+v", got)
	}
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/register", registerBody("second@example.com")),
		http.StatusConflict, "REGISTRATION_CLOSED")
}

// Одновременные регистрации не создают двух «первых»: проверка и создание — под блокировкой.
func TestRegisterRace(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	const attempts = 5
	codes := make(chan int, attempts)
	var wg sync.WaitGroup
	for i := range attempts {
		wg.Add(1)
		go func() {
			defer wg.Done()
			codes <- s.Do(http.MethodPost, "/v1/auth/register", registerBody(strings.Repeat("a", i+1)+"@example.com")).Code
		}()
	}
	wg.Wait()
	close(codes)
	created := 0
	for code := range codes {
		switch code {
		case http.StatusCreated:
			created++
		case http.StatusConflict:
		default:
			t.Errorf("ответ %d", code)
		}
	}
	if created != 1 {
		t.Fatalf("создано аккаунтов: %d", created)
	}
}

func TestRegisterValidation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	cases := []struct {
		name, field, value string
	}{
		{"почта", "email", "not-an-email"},
		{"короткий пароль", "password", "1234567"},
		// 37 русских букв — 74 байта: длиннее предела bcrypt, хотя символов меньше 72
		{"пароль длиннее 72 байт", "password", strings.Repeat("я", 37)},
		{"пустое имя", "username", ""},
		{"длинное имя", "username", strings.Repeat("и", 101)},
		{"адрес не http", "serviceUrl", "ftp://example.com"},
		{"адрес без схемы", "serviceUrl", "example.com/tasktrail"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			body := registerBody("admin@example.com")
			body[c.field] = c.value
			got := apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/register", body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
			if _, ok := got.Details[c.field]; !ok {
				t.Errorf("в details нет %q: %v", c.field, got.Details)
			}
		})
	}
	t.Run("лишнее поле", func(t *testing.T) {
		got := apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/register",
			`{"email":"a@b.cd","password":"password-1","username":"А","serviceUrl":"https://a.b","isAdmin":true}`),
			http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := got.Details["isAdmin"]; !ok {
			t.Errorf("в details нет isAdmin: %v", got.Details)
		}
	})
	t.Run("пустое тело", func(t *testing.T) {
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/register", nil), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	})
}

func TestLogin(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)

	rec := s.Do(http.MethodPost, "/v1/auth/login", map[string]string{"email": " ADMIN@example.com", "password": password})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[currentUser](t, rec); !reflect.DeepEqual(got, admin) {
		t.Fatalf("вошёл %+v, ожидался %+v", got, admin)
	}

	for name, body := range map[string]map[string]string{
		"неверный пароль": {"email": "admin@example.com", "password": "wrong-password"},
		"нет такой почты": {"email": "nobody@example.com", "password": password},
	} {
		t.Run(name, func(t *testing.T) {
			apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/login", body), http.StatusUnauthorized, "INVALID_CREDENTIALS")
		})
	}
	t.Run("пароль длиннее 72 байт", func(t *testing.T) {
		body := map[string]string{"email": "admin@example.com", "password": strings.Repeat("a", 73)}
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/login", body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	})
}

// Каждый refresh-токен обменивается один раз. Тот же токен в течение 30 секунд — параллельный
// запрос другой вкладки, позже — кража: все сессии пользователя закрываются.
func TestRefresh(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	first := s.Cookie("rt", "/v1/auth/refresh")

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil), http.StatusNoContent)
	second := s.Cookie("rt", "/v1/auth/refresh")
	if second == "" || second == first {
		t.Fatal("обновление не выдало новый refresh-токен")
	}

	s.Clock.Advance(entity.RefreshTokenReuseGrace)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil, rtCookie(first)), http.StatusNoContent)

	s.Clock.Advance(time.Second)
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil, rtCookie(first)), http.StatusUnauthorized, "UNAUTHENTICATED")
	if s.Cookie("rt", "/v1/auth/refresh") != "" {
		t.Error("после отказа cookie refresh-токена не удалена")
	}
	// Отзыв всех токенов пережил ошибку запроса: токен из «другой вкладки» тоже закрыт
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil, rtCookie(second)), http.StatusUnauthorized, "UNAUTHENTICATED")

	t.Run("без cookie", func(t *testing.T) {
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil), http.StatusUnauthorized, "UNAUTHENTICATED")
	})
	t.Run("истёк", func(t *testing.T) {
		login(t, s, "admin@example.com", password)
		s.Clock.Advance(31 * 24 * time.Hour)
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil, rtCookie(s.Cookie("rt", "/v1/auth/refresh"))),
			http.StatusUnauthorized, "UNAUTHENTICATED")
	})
}

// Сбой базы — 500, а cookie сессии остаются: после восстановления вход не нужен.
func TestRefreshKeepsCookiesOnServerError(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	s.Pool.Close()
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil), http.StatusInternalServerError, "INTERNAL")
	if s.Cookie("rt", "/v1/auth/refresh") == "" || s.Cookie("at", "/v1/projects") == "" {
		t.Fatal("cookie сессии удалены из-за сбоя сервера")
	}
}

// Access-токен живёт 15 минут, потом нужен обмен refresh-токена.
func TestAccessTokenExpires(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	s.Clock.Advance(15 * time.Minute)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/auth/check", nil), http.StatusUnauthorized, "UNAUTHENTICATED")
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil), http.StatusNoContent)
	apitest.RequireStatus(t, s.Do(http.MethodGet, "/v1/auth/check", nil), http.StatusNoContent)
}

func TestLogout(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	rt := s.Cookie("rt", "/v1/auth/logout")

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/logout", nil), http.StatusNoContent)
	if s.Cookie("at", "/v1/projects") != "" || s.Cookie("rt", "/v1/auth/refresh") != "" {
		t.Fatal("выход не удалил cookie")
	}
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil, rtCookie(rt)), http.StatusUnauthorized, "UNAUTHENTICATED")

	// Нет сессии или токен недействителен — выход всё равно удаляет cookie
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/logout", nil), http.StatusNoContent)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/logout", nil, rtCookie("garbage")), http.StatusNoContent)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/logout", nil, rtCookie(rt)), http.StatusNoContent)
}

// Выход с украденным токеном закрывает и сессию настоящего владельца.
func TestLogoutWithReusedToken(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	stolen := s.Cookie("rt", "/v1/auth/refresh")
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil), http.StatusNoContent)
	s.Clock.Advance(time.Minute)

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/logout", nil, rtCookie(stolen)), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil), http.StatusUnauthorized, "UNAUTHENTICATED")
}

// Старый API ставил refresh-токен с путём /v1/auth/refresh. Такая cookie точнее новой
// и ушла бы первой, поэтому вход её удаляет.
func TestLegacyRefreshCookieRemoved(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	legacy, _ := url.Parse(apitest.BaseURL + "/v1/auth/refresh")
	s.Jar.SetCookies(legacy, []*http.Cookie{{Name: "rt", Value: "legacy", Path: "/v1/auth/refresh", Secure: true, HttpOnly: true}})

	login(t, s, "admin@example.com", password)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/refresh", nil), http.StatusNoContent)
}

func TestChangePassword(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	body := func(oldPassword, newPassword string) map[string]string {
		return map[string]string{"oldPassword": oldPassword, "newPassword": newPassword}
	}

	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/change", body("wrong-password", "new-password")),
		http.StatusUnprocessableEntity, "WRONG_PASSWORD")
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/change", body(password, password)),
		http.StatusUnprocessableEntity, "PASSWORD_SAME_AS_OLD")
	got := apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/change", body(password, strings.Repeat("я", 37))),
		http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	if _, ok := got.Details["newPassword"]; !ok {
		t.Errorf("в details нет newPassword: %v", got.Details)
	}

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/password/change", body(password, "new-password")), http.StatusNoContent)
	login(t, s, "admin@example.com", "new-password")
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/login", map[string]string{"email": "admin@example.com", "password": password}),
		http.StatusUnauthorized, "INVALID_CREDENTIALS")

	t.Run("без входа", func(t *testing.T) {
		apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/logout", nil), http.StatusNoContent)
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/password/change", body("new-password", "other-password")),
			http.StatusUnauthorized, "UNAUTHENTICATED")
	})
}
