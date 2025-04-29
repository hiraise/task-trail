package logger

import (
	"log/slog"
	"os"
	"path"
)

func New(debug bool) *slog.Logger {
	var handler slog.Handler
	attrs := func(groups []string, a slog.Attr) slog.Attr {
		if a.Key == slog.SourceKey {
			s := a.Value.Any().(*slog.Source)
			s.File = path.Base(s.File)
		}
		return a
	}
	if !debug {
		handler = slog.NewJSONHandler(
			os.Stdout,
			&slog.HandlerOptions{Level: slog.LevelDebug, AddSource: true, ReplaceAttr: attrs},
		)
	} else {
		handler = slog.NewTextHandler(
			os.Stdout,
			&slog.HandlerOptions{Level: slog.LevelDebug, AddSource: true, ReplaceAttr: attrs},
		)
	}

	return slog.New(handler)
}
