package logger

import (
	"log"
	"log/slog"
	"os"
	"path"
	"strings"
)

type Logger interface {
	Debug(msg string, args ...any)
	Info(msg string, args ...any)
	Warn(msg string, args ...any)
	Error(msg string, args ...any)
}

func New(debug bool) *slog.Logger {
	var handler slog.Handler
	attrs := func(groups []string, a slog.Attr) slog.Attr {
		if a.Key == slog.SourceKey {
			s := a.Value.Any().(*slog.Source)
			p := strings.Split(s.Function, ".")
			s.File = p[0] + "/" + path.Base(s.File)
			s.Function = strings.Join(p[1:], ".")
		}
		return a
	}
	options := &slog.HandlerOptions{Level: slog.LevelDebug, AddSource: true, ReplaceAttr: attrs}
	if !debug {

		options.Level = slog.LevelInfo
		handler = slog.NewJSONHandler(os.Stderr, options)
	} else {
		// handler = slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{})
		handler = NewHandler(options)
	}

	kek := slog.New(handler)
	slog.SetDefault(kek)
	log.SetFlags(log.Lshortfile)
	return kek
}
