package logger

import (
	"log"
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
		handler = slog.NewJSONHandler(os.Stderr, options)
	} else {
		handler = slog.NewTextHandler(os.Stderr, options)
	}

	kek := slog.New(handler)
	slog.SetDefault(kek)
	log.SetFlags(log.Lshortfile)
	return kek
}
