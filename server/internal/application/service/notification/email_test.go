package notification_test

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"task-trail/internal/application/service/notification"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"task-trail/test/clock"
	"task-trail/test/mocks"

	"go.uber.org/mock/gomock"
)

type emailMocks struct {
	notifications *mocks.MockNotificationRepository
	users         *mocks.MockUserRepository
	settings      *mocks.MockSettingsRepository
	mailer        *mocks.MockMailer
}

func newEmailModule(t *testing.T, at time.Time) (*notification.NotificationModule, emailMocks) {
	ctrl := gomock.NewController(t)
	m := emailMocks{
		notifications: mocks.NewMockNotificationRepository(ctrl), users: mocks.NewMockUserRepository(ctrl),
		settings: mocks.NewMockSettingsRepository(ctrl), mailer: mocks.NewMockMailer(ctrl),
	}
	return notification.New(notification.Deps{
		TxManager: mocks.NewMockTxManager(ctrl), Clock: clock.New(at),
		NotificationRepo: m.notifications, UserRepo: m.users, SettingsRepo: m.settings, Mailer: m.mailer,
		Retention: 90 * 24 * time.Hour, EmailDelay: 5 * time.Minute, EmailMaxAge: 24 * time.Hour,
	}), m
}

// Without mail the job does nothing and reads no notifications (ADR-0017).
func TestSendEmailsWithoutMail(t *testing.T) {
	module, m := newEmailModule(t, now)
	m.settings.EXPECT().GetMail(gomock.Any()).Return(nil, nil)
	if n, err := module.SendEmails.Execute(context.Background()); err != nil || n != 0 {
		t.Fatalf("%d, %v", n, err)
	}
}

// Without the service address there is no link to put in an email: the job fails and logs it.
func TestSendEmailsWithoutServiceURL(t *testing.T) {
	module, m := newEmailModule(t, now)
	m.settings.EXPECT().GetMail(gomock.Any()).Return(&entity.MailSettings{}, nil)
	m.settings.EXPECT().GetServiceURL(gomock.Any()).Return("", nil)
	if _, err := module.SendEmails.Execute(context.Background()); err == nil {
		t.Fatal("no error without the service address")
	}
}

// The window is [now - max age, now - delay]; the actors come in one query; a send error stops the
// batch and only the sent ones are marked.
func TestSendEmails(t *testing.T) {
	module, m := newEmailModule(t, now)
	settings := &entity.MailSettings{}
	m.settings.EXPECT().GetMail(gomock.Any()).Return(settings, nil)
	m.settings.EXPECT().GetServiceURL(gomock.Any()).Return("https://example.com", nil)
	anna, annaName := entity.UserID("anna"), "Анна"
	from, to := entity.StatusOpen, entity.StatusDone
	dueDate := "2026-10-22"
	ivan := &entity.UserAccount{ID: "ivan", Email: "ivan@example.com"}
	batch := []*repository.EmailView{
		{View: repository.NotificationView{TaskKey: "DS-1", TaskName: "Кнопка", Notification: &entity.Notification{
			ID: "1", TaskID: "t1", ActorID: &anna, Kind: entity.NotifyStatusChanged, FromStatus: &from, ToStatus: &to}}, Recipient: ivan},
		{View: repository.NotificationView{TaskKey: "DS-2", TaskName: "Поле", Notification: &entity.Notification{
			ID: "2", TaskID: "t2", Kind: entity.NotifyDueSoon, DueDate: &dueDate}}, Recipient: ivan},
		{View: repository.NotificationView{TaskKey: "DS-3", Notification: &entity.Notification{
			ID: "3", TaskID: "t3", ActorID: &anna, Kind: entity.NotifyAssigned}}, Recipient: ivan},
	}
	m.notifications.EXPECT().ListToEmail(gomock.Any(), now.Add(-24*time.Hour), now.Add(-5*time.Minute), 50).Return(batch, nil)
	m.users.EXPECT().ListByIDs(gomock.Any(), []entity.UserID{anna, anna}).
		Return([]*entity.UserAccount{{ID: anna, Username: &annaName, Email: "anna@example.com"}}, nil)
	var letters []service.Letter
	gomock.InOrder(
		m.mailer.EXPECT().Send(gomock.Any(), settings, gomock.Any()).DoAndReturn(
			func(ctx context.Context, _ *entity.MailSettings, l service.Letter) error {
				if _, ok := ctx.Deadline(); !ok {
					t.Error("send without a timeout")
				}
				letters = append(letters, l)
				return nil
			}),
		m.notifications.EXPECT().MarkEmailed(gomock.Any(), entity.NotificationID("1"), now).Return(nil),
		m.mailer.EXPECT().Send(gomock.Any(), settings, gomock.Any()).DoAndReturn(
			func(_ context.Context, _ *entity.MailSettings, l service.Letter) error {
				letters = append(letters, l)
				return nil
			}),
		m.notifications.EXPECT().MarkEmailed(gomock.Any(), entity.NotificationID("2"), now).Return(nil),
		m.mailer.EXPECT().Send(gomock.Any(), settings, gomock.Any()).Return(errors.New("smtp down")),
	)
	n, err := module.SendEmails.Execute(context.Background())
	if err == nil || n != 2 {
		t.Fatalf("%d, %v", n, err)
	}
	if l := letters[0]; l.To != "ivan@example.com" || l.Subject != "DS-1: Анна изменил(а) статус: Открыта → Готово" ||
		!strings.Contains(l.Text, "https://example.com/tasks/t1") || !strings.Contains(l.Text, "https://example.com/profile") {
		t.Errorf("status email: %+v", l)
	}
	if l := letters[1]; l.Subject != "DS-2: Срок задачи — завтра, 22.10.2026" {
		t.Errorf("reminder email: %+v", l)
	}
}

// Reminders start at 06:00 UTC and look at tomorrow and yesterday; resolved statuses are skipped.
func TestRemind(t *testing.T) {
	early, _ := newEmailModule(t, time.Date(2026, 10, 21, 5, 59, 0, 0, time.UTC))
	if n, err := early.Remind.Execute(context.Background()); err != nil || n != 0 {
		t.Fatalf("before 06:00: %d, %v", n, err)
	}
	at := time.Date(2026, 10, 21, 6, 0, 0, 0, time.UTC)
	module, m := newEmailModule(t, at)
	m.notifications.EXPECT().CreateDueReminders(gomock.Any(),
		time.Date(2026, 10, 22, 0, 0, 0, 0, time.UTC), time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC),
		[]entity.TaskStatus{entity.StatusDone}, at).Return(int64(2), nil)
	if n, err := module.Remind.Execute(context.Background()); err != nil || n != 2 {
		t.Fatalf("at 06:00: %d, %v", n, err)
	}
}
