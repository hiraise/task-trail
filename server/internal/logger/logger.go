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
	options := &slog.HandlerOptions{Level: slog.LevelDebug, AddSource: true, ReplaceAttr: attrs}
	if !debug {

		options.Level = slog.LevelInfo
		handler = slog.NewJSONHandler(os.Stdout, options)
	} else {
		handler = slog.NewTextHandler(os.Stdout, options)
	}

	return slog.New(handler)
}
