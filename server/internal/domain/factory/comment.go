package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

type CommentFactory struct {
	idGenerator service.IDGenerator
	clock       service.Clock
}

func NewCommentFactory(idGenerator service.IDGenerator, clock service.Clock) *CommentFactory {
	return &CommentFactory{idGenerator: idGenerator, clock: clock}
}

// New — a comment by authorID on task taskID, written now.
func (f *CommentFactory) New(taskID entity.TaskID, authorID entity.UserID, text string) *entity.Comment {
	return entity.NewComment(entity.CommentID(f.idGenerator.Generate()), taskID, authorID, text, f.clock.Now())
}
