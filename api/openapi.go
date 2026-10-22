// Package api embeds the contract into the server binary: Swagger shows it to the administrator
// (ADR-0014). Why it is a separate module and how the server includes it — ADR-0023.
package api

import _ "embed"

// OpenAPI is the content of api/openapi.yaml.
//
//go:embed openapi.yaml
var OpenAPI []byte
