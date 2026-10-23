package response

import (
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
)

// TaskComment is a task comment (TaskComment in the contract).
type TaskComment struct {
	ID        string     `json:"id"`
	TaskID    string     `json:"taskId"`
	Author    User       `json:"author"`
	Text      string     `json:"text"`
	CreatedAt time.Time  `json:"createdAt"`
	EditedAt  *time.Time `json:"editedAt"`
}

func NewTaskComment(c dto.Comment) TaskComment {
	return TaskComment{
		ID:        string(c.Comment.ID),
		TaskID:    string(c.Comment.TaskID),
		Author:    NewUser(c.Author),
		Text:      c.Comment.Text,
		CreatedAt: c.Comment.CreatedAt.UTC(),
		EditedAt:  utc(c.Comment.EditedAt),
	}
}

func NewTaskComments(comments []dto.Comment) []TaskComment {
	out := make([]TaskComment, len(comments))
	for i, c := range comments {
		out[i] = NewTaskComment(c)
	}
	return out
}

// TaskEvent is a task history row (TaskEvent in the contract): change fields the kind does not use
// are null.
type TaskEvent struct {
	ID           string    `json:"id"`
	TaskID       string    `json:"taskId"`
	Kind         string    `json:"kind"`
	Actor        User      `json:"actor"`
	CreatedAt    time.Time `json:"createdAt"`
	FromStatusID *string   `json:"fromStatusId"`
	ToStatusID   *string   `json:"toStatusId"`
	FromUser     *User     `json:"fromUser"`
	ToUser       *User     `json:"toUser"`
	FromKey      *string   `json:"fromKey"`
	ToKey        *string   `json:"toKey"`
}

func NewTaskEvents(events []dto.TaskEvent) []TaskEvent {
	status := func(s *entity.TaskStatus) *string {
		if s == nil {
			return nil
		}
		v := string(*s)
		return &v
	}
	user := func(u *entity.UserAccount) *User {
		if u == nil {
			return nil
		}
		v := NewUser(u)
		return &v
	}
	out := make([]TaskEvent, len(events))
	for i, v := range events {
		e := v.Event
		out[i] = TaskEvent{
			ID:           string(e.ID),
			TaskID:       string(e.TaskID),
			Kind:         string(e.Kind),
			Actor:        NewUser(v.Actor),
			CreatedAt:    e.CreatedAt.UTC(),
			FromStatusID: status(e.FromStatus),
			ToStatusID:   status(e.ToStatus),
			FromUser:     user(v.FromUser),
			ToUser:       user(v.ToUser),
			FromKey:      e.FromKey,
			ToKey:        e.ToKey,
		}
	}
	return out
}
