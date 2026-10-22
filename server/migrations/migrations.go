// Package migrations встраивает SQL-миграции в бинарник сервера: он применяет их при каждом
// запуске (ADR-0015), и папка миграций рядом с бинарником не нужна.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
