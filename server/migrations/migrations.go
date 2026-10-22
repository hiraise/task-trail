// Package migrations embeds SQL migrations into the server binary: it applies them on every
// start (ADR-0015), and no migrations folder is needed next to the binary.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
