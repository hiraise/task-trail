package tasks

import (
	"context"
	"os"
	"task-trail/internal/pkg/logger"
	"task-trail/internal/repo"

	"github.com/robfig/cron/v3"
)

func CleanupTokens(r repo.RefreshTokenRepository, l logger.Logger) {
	c := cron.New()
	_, err := c.AddFunc("0 3 * * *", func() {
		deleted, err := r.DeleteRevokedAndOldTokens(context.Background(), 7)
		if err != nil {
			l.Error("Failed to delete old and revoked tokens", "error", err)
			return
		}
		l.Info("Complete delete old and revoked tokens", "deleted_tokens", deleted)

	})
	if err != nil {
		l.Error("cron task start failed", "error", err.Error())
		os.Exit(1)
	}
	c.Start()
}
