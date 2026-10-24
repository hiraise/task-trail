// Package notification holds the use cases of a user's own notifications (ADR-0038): the list,
// the unread count, read marks and the cleanup of old ones. Task services write notifications.
package notification

import (
	"context"
	"errors"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// listLimit — how many of the newest notifications the list shows (ADR-0038).
const listLimit = 100

type NotificationModule struct {
	List        *ListService
	UnreadCount *UnreadCountService
	SetRead     *SetReadService
	ReadAll     *ReadAllService
	Cleanup     *CleanupService
}

// Deps are the dependencies of the notification module.
type Deps struct {
	TxManager        transaction.TxManager
	Clock            service.Clock
	NotificationRepo repository.NotificationRepository
	UserRepo         repository.UserRepository
	// Retention — how long notifications are kept (ADR-0038).
	Retention time.Duration
}

func New(d Deps) *NotificationModule {
	people := &people{users: d.UserRepo}
	return &NotificationModule{
		List:        &ListService{notifications: d.NotificationRepo, people: people},
		UnreadCount: &UnreadCountService{notifications: d.NotificationRepo},
		SetRead: &SetReadService{
			txManager: d.TxManager, clock: d.Clock, notifications: d.NotificationRepo, people: people,
		},
		ReadAll: &ReadAllService{clock: d.Clock, notifications: d.NotificationRepo},
		Cleanup: &CleanupService{clock: d.Clock, notifications: d.NotificationRepo, retention: d.Retention},
	}
}

// people adds the actors to notifications with one query.
type people struct {
	users repository.UserRepository
}

func (p *people) add(ctx context.Context, views []*repository.NotificationView) ([]dto.Notification, error) {
	var ids []entity.UserID
	for _, v := range views {
		if v.Notification.ActorID != nil {
			ids = append(ids, *v.Notification.ActorID)
		}
	}
	byID := map[entity.UserID]*entity.UserAccount{}
	if len(ids) > 0 {
		users, err := p.users.ListByIDs(ctx, ids)
		if err != nil {
			return nil, err
		}
		for _, u := range users {
			byID[u.ID] = u
		}
	}
	result := make([]dto.Notification, len(views))
	for i, v := range views {
		result[i] = dto.Notification{View: v}
		if id := v.Notification.ActorID; id != nil {
			if result[i].Actor = byID[*id]; result[i].Actor == nil {
				return nil, domain.ErrRepoInternal(1, errors.New("notification actor not found"), "userID", *id)
			}
		}
	}
	return result, nil
}

// ListService — the user's newest notifications, newest first.
type ListService struct {
	notifications repository.NotificationRepository
	people        *people
}

func (s *ListService) Execute(ctx context.Context, userID string) ([]dto.Notification, error) {
	views, err := s.notifications.ListForUser(ctx, entity.UserID(userID), listLimit)
	if err != nil {
		return nil, err
	}
	return s.people.add(ctx, views)
}

// UnreadCountService — how many of the user's notifications are unread.
type UnreadCountService struct {
	notifications repository.NotificationRepository
}

func (s *UnreadCountService) Execute(ctx context.Context, userID string) (int, error) {
	return s.notifications.CountUnread(ctx, entity.UserID(userID))
}

// SetReadService marks the user's notification read or unread; another user's is ENTITY_NOT_FOUND.
type SetReadService struct {
	txManager     transaction.TxManager
	clock         service.Clock
	notifications repository.NotificationRepository
	people        *people
}

func (s *SetReadService) Execute(ctx context.Context, userID, id string, read bool) (*dto.Notification, error) {
	var view *repository.NotificationView
	f := func(ctx context.Context) error {
		v, err := s.notifications.Get(ctx, entity.UserID(userID), entity.NotificationID(id))
		if err != nil {
			return err
		}
		v.Notification.SetRead(read, s.clock.Now())
		if err := s.notifications.SetReadAt(ctx, v.Notification.ID, v.Notification.ReadAt); err != nil {
			return err
		}
		view = v
		return nil
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	result, err := s.people.add(ctx, []*repository.NotificationView{view})
	if err != nil {
		return nil, err
	}
	return &result[0], nil
}

// ReadAllService marks all the user's notifications read.
type ReadAllService struct {
	clock         service.Clock
	notifications repository.NotificationRepository
}

func (s *ReadAllService) Execute(ctx context.Context, userID string) error {
	return s.notifications.MarkAllRead(ctx, entity.UserID(userID), s.clock.Now())
}

// CleanupService deletes notifications older than the retention; the hourly cleanup calls it.
type CleanupService struct {
	clock         service.Clock
	notifications repository.NotificationRepository
	retention     time.Duration
}

func (s *CleanupService) Execute(ctx context.Context) (int64, error) {
	return s.notifications.DeleteOlderThan(ctx, s.clock.Now().Add(-s.retention))
}
