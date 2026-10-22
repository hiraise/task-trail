// Package api встраивает контракт в бинарник сервера: Swagger показывает его администратору
// (ADR-0014). Почему отдельный модуль и как сервер его подключает — ADR-0023.
package api

import _ "embed"

// OpenAPI — содержимое api/openapi.yaml.
//
//go:embed openapi.yaml
var OpenAPI []byte
