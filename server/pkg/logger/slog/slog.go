package slogger

import (
	"log"
	"log/slog"
	"os"
	"path"
	"strings"
)



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
		handler = NewHandler(options)
	}

	kek := slog.New(handler)
	slog.SetDefault(kek)
	log.SetFlags(log.Lshortfile)
	return kek
}
