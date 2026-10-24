package notification_test

import (
	"context"
	"testing"
	"time"

	"task-trail/internal/application/service/notification"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/test/clock"
	"task-trail/test/mocks"

	"go.uber.org/mock/gomock"
)

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

func newModule(t *testing.T) (*notification.NotificationModule, *mocks.MockNotificationRepository, *mocks.MockUserRepository) {
	ctrl := gomock.NewController(t)
	notifications, users := mocks.NewMockNotificationRepository(ctrl), mocks.NewMockUserRepository(ctrl)
	return notification.New(notification.Deps{
		TxManager: mocks.NewMockTxManager(ctrl), Clock: clock.New(now),
		NotificationRepo: notifications, UserRepo: users, Retention: 90 * 24 * time.Hour,
	}), notifications, users
}

// The list gets its actors in one query; a reminder has no actor (ADR-0038).
func TestList(t *testing.T) {
	module, notifications, users := newModule(t)
	anna := entity.UserID("anna")
	views := []*repository.NotificationView{
		{Notification: &entity.Notification{ID: "1", ActorID: &anna, Kind: entity.NotifyAssigned}},
		{Notification: &entity.Notification{ID: "2", Kind: entity.NotifyDueSoon}},
	}
	notifications.EXPECT().ListForUser(gomock.Any(), entity.UserID("ivan"), 100).Return(views, nil)
	users.EXPECT().ListByIDs(gomock.Any(), []entity.UserID{anna}).Return([]*entity.UserAccount{{ID: anna}}, nil)
	got, err := module.List.Execute(context.Background(), "ivan")
	if err != nil || len(got) != 2 || got[0].Actor == nil || got[0].Actor.ID != anna || got[1].Actor != nil {
		t.Fatalf("%+v, %v", got, err)
	}
}

// The cleanup deletes notifications older than the retention.
func TestCleanup(t *testing.T) {
	module, notifications, _ := newModule(t)
	notifications.EXPECT().DeleteOlderThan(gomock.Any(), now.Add(-90*24*time.Hour)).Return(int64(3), nil)
	if n, err := module.Cleanup.Execute(context.Background()); err != nil || n != 3 {
		t.Fatalf("%d, %v", n, err)
	}
}
