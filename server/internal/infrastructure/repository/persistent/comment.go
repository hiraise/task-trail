package persistent

import (
	"context"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGCommentRepository struct {
	PgRepository
}

func NewCommentRepo(db *pgxpool.Pool) *PGCommentRepository {
	return &PGCommentRepository{PgRepository: PgRepository{pg: db}}
}

func (r *PGCommentRepository) Create(ctx context.Context, c *entity.Comment) error {
	return r.insert(ctx, "task_comments", map[string]any{
		"id":         c.ID,
		"task_id":    c.TaskID,
		"author_id":  c.AuthorID,
		"text":       c.Text,
		"created_at": c.CreatedAt,
		"edited_at":  c.EditedAt,
	})
}

const commentColumns = `id, task_id, author_id, text, created_at, edited_at`

func (r *PGCommentRepository) Get(ctx context.Context, id entity.CommentID) (*entity.Comment, error) {
	c, err := scanComment(r.getDb(ctx).QueryRow(ctx, `SELECT `+commentColumns+` FROM task_comments WHERE id = $1`, id))
	if err != nil {
		return nil, r.handleError(err)
	}
	return c, nil
}

func (r *PGCommentRepository) ListByTask(ctx context.Context, taskID entity.TaskID) ([]*entity.Comment, error) {
	rows, err := r.getDb(ctx).Query(ctx,
		`SELECT `+commentColumns+` FROM task_comments WHERE task_id = $1 ORDER BY created_at DESC, seq DESC`, taskID)
	if err != nil {
		return nil, r.handleError(err)
	}
	comments, err := ScanRows(rows, func(row pgx.Rows) (*entity.Comment, error) { return scanComment(row) })
	if err != nil {
		return nil, r.handleError(err)
	}
	return comments, nil
}

func (r *PGCommentRepository) Update(ctx context.Context, c *entity.Comment) error {
	tag, err := r.getDb(ctx).Exec(ctx, `UPDATE task_comments SET text = $2, edited_at = $3 WHERE id = $1`, c.ID, c.Text, c.EditedAt)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "commentID", c.ID)
	}
	return nil
}

func (r *PGCommentRepository) Delete(ctx context.Context, id entity.CommentID) error {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM task_comments WHERE id = $1`, id)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "commentID", id)
	}
	return nil
}

func scanComment(row pgx.Row) (*entity.Comment, error) {
	var id, taskID, authorID string
	c := &entity.Comment{}
	if err := row.Scan(&id, &taskID, &authorID, &c.Text, &c.CreatedAt, &c.EditedAt); err != nil {
		return nil, err
	}
	c.ID, c.TaskID, c.AuthorID = entity.CommentID(id), entity.TaskID(taskID), entity.UserID(authorID)
	return c, nil
}
