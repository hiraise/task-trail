package notification

import (
	"context"
	"errors"
	"time"

	"task-trail/internal/application/letter"
	"task-trail/internal/application/link"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

const (
	// emailBatch — how many notifications one run of the email job sends at most.
	emailBatch = 50
	// emailSendTimeout — how long one email may take to send.
	emailSendTimeout = 10 * time.Second
	// reminderHourUTC — due date reminders are written from this hour of the day (ADR-0038).
	reminderHourUTC = 6
)

// SendEmailsService repeats unread notifications by email (ADR-0038): EmailDelay after they were
// created and until EmailMaxAge, while mail is connected. A send error stops the batch; the next
// run retries the rest. Errors do not reach the API: the periodic job logs them.
type SendEmailsService struct {
	clock         service.Clock
	settings      repository.SettingsRepository
	mailer        service.Mailer
	notifications repository.NotificationRepository
	people        *people
	delay, maxAge time.Duration
}

func (s *SendEmailsService) Execute(ctx context.Context) (int64, error) {
	settings, err := s.settings.GetMail(ctx)
	if err != nil || settings == nil {
		return 0, err
	}
	serviceURL, err := s.settings.GetServiceURL(ctx)
	if err != nil {
		return 0, err
	}
	if serviceURL == "" {
		return 0, errors.New("service address is not set")
	}
	now := s.clock.Now()
	batch, err := s.notifications.ListToEmail(ctx, now.Add(-s.maxAge), now.Add(-s.delay), emailBatch)
	if err != nil {
		return 0, err
	}
	views := make([]*repository.NotificationView, len(batch))
	for i, e := range batch {
		views[i] = &e.View
	}
	withActors, err := s.people.add(ctx, views)
	if err != nil {
		return 0, err
	}
	var sent int64
	for i, e := range batch {
		l := letter.TaskNotification(e.Recipient.Email, emailData(withActors[i].View, withActors[i].Actor, serviceURL))
		if err := s.send(ctx, settings, l); err != nil {
			return sent, err
		}
		if err := s.notifications.MarkEmailed(ctx, e.View.Notification.ID, s.clock.Now()); err != nil {
			return sent, err
		}
		sent++
	}
	return sent, nil
}

func (s *SendEmailsService) send(ctx context.Context, settings *entity.MailSettings, l service.Letter) error {
	ctx, cancel := context.WithTimeout(ctx, emailSendTimeout)
	defer cancel()
	return s.mailer.Send(ctx, settings, l)
}

// emailData fills an email from a notification; actor is nil for reminders.
func emailData(v *repository.NotificationView, actor *entity.UserAccount, serviceURL string) letter.TaskNotificationData {
	n := v.Notification
	d := letter.TaskNotificationData{
		Kind: n.Kind, TaskKey: v.TaskKey, TaskName: v.TaskName,
		TaskURL: link.Task(serviceURL, n.TaskID), ProfileURL: link.Profile(serviceURL),
	}
	if actor != nil {
		d.Actor = entity.DisplayName(actor.Username, actor.Email)
	}
	if n.FromStatus != nil && n.ToStatus != nil {
		d.FromStatus, d.ToStatus = statusName(*n.FromStatus), statusName(*n.ToStatus)
	}
	if n.Text != nil {
		d.Text = *n.Text
	}
	if n.DueDate != nil {
		d.DueDate = *n.DueDate
		if date, err := entity.ParseDueDate(*n.DueDate); err == nil {
			d.DueDate = date.Format("02.01.2006")
		}
	}
	return d
}

func statusName(status entity.TaskStatus) string {
	for _, s := range entity.TaskStatuses() {
		if s.ID == status {
			return s.Name
		}
	}
	return string(status)
}

// RemindService writes due date reminders (ADR-0038): due_soon the day before the due date and
// overdue the day after it. The hourly job calls it; nothing happens before reminderHourUTC, and
// a reminder already written is not repeated.
type RemindService struct {
	clock         service.Clock
	notifications repository.NotificationRepository
}

func (s *RemindService) Execute(ctx context.Context) (int64, error) {
	now := s.clock.Now().UTC()
	if now.Hour() < reminderHourUTC {
		return 0, nil
	}
	today := entity.NewDueDate(now.Date())
	var resolved []entity.TaskStatus
	for _, st := range entity.TaskStatuses() {
		if st.IsResolved {
			resolved = append(resolved, st.ID)
		}
	}
	return s.notifications.CreateDueReminders(ctx, today.AddDate(0, 0, 1), today.AddDate(0, 0, -1), resolved, now)
}
