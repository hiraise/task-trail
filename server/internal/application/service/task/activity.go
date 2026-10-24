package task

import (
	"context"
	"errors"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
)

// feed reads the task feed (ADR-0028): comments and history are seen by members of the task's project.
type feed struct {
	members repository.ProjectMemberRepository
	tasks   repository.TaskRepository
	users   repository.UserRepository
}

// task finds the task userID may read: a non-member gets ENTITY_NOT_FOUND.
func (f *feed) task(ctx context.Context, userID, taskID string) (*entity.Task, error) {
	task, err := f.tasks.Get(ctx, entity.TaskID(taskID))
	if err != nil {
		return nil, err
	}
	if _, err := f.members.Get(ctx, task.ProjectID, entity.UserID(userID)); err != nil {
		return nil, err
	}
	return task, nil
}

// people reads the users with ids in one query. A missing user is a broken reference: comments
// and events point to users with a foreign key, and deleted users are read too.
func (f *feed) people(ctx context.Context, ids []entity.UserID) (func(entity.UserID) (*entity.UserAccount, error), error) {
	users, err := f.users.ListByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	byID := make(map[entity.UserID]*entity.UserAccount, len(users))
	for _, u := range users {
		byID[u.ID] = u
	}
	return func(id entity.UserID) (*entity.UserAccount, error) {
		if u := byID[id]; u != nil {
			return u, nil
		}
		return nil, domain.ErrRepoInternal(2, errors.New("feed user not found"), "userID", id)
	}, nil
}

func (f *feed) comments(ctx context.Context, comments []*entity.Comment) ([]dto.Comment, error) {
	ids := make([]entity.UserID, len(comments))
	for i, c := range comments {
		ids[i] = c.AuthorID
	}
	person, err := f.people(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make([]dto.Comment, len(comments))
	for i, c := range comments {
		author, err := person(c.AuthorID)
		if err != nil {
			return nil, err
		}
		out[i] = dto.Comment{Comment: c, Author: author}
	}
	return out, nil
}

func (f *feed) comment(ctx context.Context, c *entity.Comment) (*dto.Comment, error) {
	out, err := f.comments(ctx, []*entity.Comment{c})
	if err != nil {
		return nil, err
	}
	return &out[0], nil
}

// ListCommentsService returns the task's comments, newest first.
type ListCommentsService struct {
	feed     *feed
	comments repository.CommentRepository
}

func (s *ListCommentsService) Execute(ctx context.Context, userID, taskID string) ([]dto.Comment, error) {
	task, err := s.feed.task(ctx, userID, taskID)
	if err != nil {
		return nil, err
	}
	comments, err := s.comments.ListByTask(ctx, task.ID)
	if err != nil {
		return nil, err
	}
	return s.feed.comments(ctx, comments)
}

// ListEventsService returns the task's history, newest first.
type ListEventsService struct {
	feed   *feed
	events repository.TaskEventRepository
}

func (s *ListEventsService) Execute(ctx context.Context, userID, taskID string) ([]dto.TaskEvent, error) {
	task, err := s.feed.task(ctx, userID, taskID)
	if err != nil {
		return nil, err
	}
	events, err := s.events.ListByTask(ctx, task.ID)
	if err != nil {
		return nil, err
	}
	var ids []entity.UserID
	for _, e := range events {
		ids = append(ids, e.UserIDs()...)
	}
	person, err := s.feed.people(ctx, ids)
	if err != nil {
		return nil, err
	}
	optional := func(id *entity.UserID) (*entity.UserAccount, error) {
		if id == nil {
			return nil, nil
		}
		return person(*id)
	}
	out := make([]dto.TaskEvent, len(events))
	for i, e := range events {
		v := dto.TaskEvent{Event: e}
		if v.Actor, err = person(e.ActorID); err != nil {
			return nil, err
		}
		if v.FromUser, err = optional(e.FromUser); err != nil {
			return nil, err
		}
		if v.ToUser, err = optional(e.ToUser); err != nil {
			return nil, err
		}
		out[i] = v
	}
	return out, nil
}

// commentChange runs change in a transaction under the lock of the task's project: the task and its
// project are active (ADR-0027), the member is userID's membership in the project.
func (e *editor) commentChange(ctx context.Context, userID, taskID string,
	change func(ctx context.Context, task *entity.Task, member *entity.ProjectMember) error,
) error {
	return e.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		task, member, projects, err := e.lock(ctx, taskID, userID)
		if err != nil {
			return err
		}
		if err := projects[task.ProjectID].RequireActive(); err != nil {
			return err
		}
		if err := task.RequireActive(); err != nil {
			return err
		}
		return change(ctx, task, member)
	})
}

// taskComment finds a comment of the task: a comment of another task is not found (ADR-0028).
func taskComment(ctx context.Context, comments repository.CommentRepository, task *entity.Task, commentID string) (*entity.Comment, error) {
	c, err := comments.Get(ctx, entity.CommentID(commentID))
	if err != nil {
		return nil, err
	}
	if c.TaskID != task.ID {
		return nil, domain.ErrEntityNotFound(2, nil, "commentID", commentID, "taskID", task.ID)
	}
	return c, nil
}

// CreateCommentService: any member of the task's project comments an active task.
type CreateCommentService struct {
	editor   *editor
	feed     *feed
	comments repository.CommentRepository
	factory  *factory.CommentFactory
}

func (s *CreateCommentService) Execute(ctx context.Context, userID, taskID, text string) (*dto.Comment, error) {
	var comment *entity.Comment
	err := s.editor.commentChange(ctx, userID, taskID, func(ctx context.Context, task *entity.Task, member *entity.ProjectMember) error {
		comment = s.factory.New(task.ID, member.UserID, text)
		if err := s.comments.Create(ctx, comment); err != nil {
			return err
		}
		excerpt := entity.CommentExcerpt(comment.Text)
		// Step 15 (ADR-0039): users mentioned in the comment get "mentioned" instead.
		notifications := s.editor.notifyEach(task, entity.TaskRecipients(task, member.UserID), member.UserID,
			entity.NotifyCommented, comment.CreatedAt, func(n *entity.Notification) { n.Text = &excerpt })
		return s.editor.notify(ctx, notifications...)
	})
	if err != nil {
		return nil, err
	}
	return s.feed.comment(ctx, comment)
}

// EditCommentService: the author edits a comment during CommentEditWindow.
type EditCommentService struct {
	editor   *editor
	feed     *feed
	comments repository.CommentRepository
}

func (s *EditCommentService) Execute(ctx context.Context, userID, taskID, commentID, text string) (*dto.Comment, error) {
	var comment *entity.Comment
	err := s.editor.commentChange(ctx, userID, taskID, func(ctx context.Context, task *entity.Task, member *entity.ProjectMember) error {
		c, err := taskComment(ctx, s.comments, task, commentID)
		if err != nil {
			return err
		}
		if err := c.Edit(member.UserID, text, s.editor.clock.Now()); err != nil {
			return err
		}
		comment = c
		return s.comments.Update(ctx, c)
	})
	if err != nil {
		return nil, err
	}
	return s.feed.comment(ctx, comment)
}

// DeleteCommentService: the author, the project owner or a project admin erases a comment.
type DeleteCommentService struct {
	editor   *editor
	comments repository.CommentRepository
}

func (s *DeleteCommentService) Execute(ctx context.Context, userID, taskID, commentID string) error {
	return s.editor.commentChange(ctx, userID, taskID, func(ctx context.Context, task *entity.Task, member *entity.ProjectMember) error {
		c, err := taskComment(ctx, s.comments, task, commentID)
		if err != nil {
			return err
		}
		if err := c.CheckDelete(member); err != nil {
			return err
		}
		return s.comments.Delete(ctx, c.ID)
	})
}
