package tasks

import (
	"os"
	"task-trail/internal/pkg/logger"

	"github.com/robfig/cron/v3"
)

// func CleanupRefreshTokens(r repository.RefreshTokenRepository, l logger.Logger) {
// 	startNewTask("0 3 * * *", l, "cleanup refresh tokens", func() {
// 		deleted, err := r.DeleteRevokedAndOldTokens(context.Background(), 7)
// 		if err != nil {
// 			l.Error("failed to delete old and revoked refresh tokens", "error", err)
// 			return
// 		}
// 		l.Info("complete delete old and revoked refresh tokens", "deleted_tokens", deleted)

// 	})
// }

// func CleanupEmailTokens(r repository.ConfirmationTokenRepository, l logger.Logger) {
// 	startNewTask("30 3 * * *", l, "cleanup email tokens", func() {
// 		deleted, err := r.DeleteUsedAndOldTokens(context.Background(), 7)
// 		if err != nil {
// 			l.Error("failed to delete old and used email tokens", "error", err)
// 			return
// 		}
// 		l.Info("complete delete old and used email tokens", "deleted_tokens", deleted)

// 	})
// }

func startNewTask(spec string, l logger.Logger, name string, f func()) {
	c := cron.New()
	_, err := c.AddFunc(spec, f)
	if err != nil {
		l.Error("cron task start failed", "error", err.Error())
		os.Exit(1)
	}
	c.Start()
	l.Info("cron task successfully started", "task name", name, "spec", spec)
}
