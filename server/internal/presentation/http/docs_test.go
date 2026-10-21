package http_test

import (
	"bytes"
	"net/http"
	"strings"
	"testing"

	"task-trail/api"
	"task-trail/test/apitest"
	"task-trail/test/contract"
)

type user struct {
	ID string `json:"id"`
}

func register(t *testing.T, s *apitest.Server) user {
	t.Helper()
	rec := s.Do(http.MethodPost, "/v1/auth/register", map[string]string{
		"email": "admin@example.com", "password": "password-1", "username": "Админ", "serviceUrl": "https://example.com",
	})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[user](t, rec)
}

// Swagger показывает контракт api/openapi.yaml (ADR-0005) и только администратору сервиса (ADR-0014).
func TestDocsForAdmin(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	register(t, s)

	rec := s.Get("/docs/")
	apitest.RequireStatus(t, rec, http.StatusOK)
	if !strings.Contains(rec.Body.String(), `<div id="swagger-ui">`) || !strings.HasPrefix(rec.Header().Get("Content-Type"), "text/html") {
		t.Fatalf("страница Swagger: %s %q", rec.Header().Get("Content-Type"), rec.Body.String())
	}
	rec = s.Get("/docs/openapi.yaml")
	apitest.RequireStatus(t, rec, http.StatusOK)
	if !bytes.Equal(rec.Body.Bytes(), api.OpenAPI) || len(api.OpenAPI) == 0 {
		t.Fatal("отдан не api/openapi.yaml")
	}
	if rec := s.Get("/docs/swagger-initializer.js"); !strings.Contains(rec.Body.String(), `url: "openapi.yaml"`) {
		t.Fatalf("Swagger UI открывает не контракт: %s", rec.Body.String())
	}
	rec = s.Get("/docs/swagger-ui-bundle.js")
	apitest.RequireStatus(t, rec, http.StatusOK)
	if rec.Body.Len() < 100_000 {
		t.Fatalf("сборка Swagger UI: %d байт", rec.Body.Len())
	}
	apitest.RequireError(t, s.Get("/docs/nope.js"), http.StatusNotFound, "NOT_FOUND")
}

func TestDocsHiddenFromOthers(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := register(t, s)
	token := s.Invite(s.CreateProject("Дизайн-система"), "ivan@example.com", admin.ID)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/logout", nil), http.StatusNoContent)

	for _, path := range []string{"/docs/", "/docs/openapi.yaml"} {
		apitest.RequireError(t, s.Get(path), http.StatusUnauthorized, "UNAUTHENTICATED")
	}
	rec := s.Do(http.MethodPost, "/v1/auth/invitations/accept", map[string]string{"token": token, "username": "Иван", "password": "password-1"})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	for _, path := range []string{"/docs/", "/docs/openapi.yaml"} {
		apitest.RequireError(t, s.Get(path), http.StatusForbidden, "FORBIDDEN")
	}
}
