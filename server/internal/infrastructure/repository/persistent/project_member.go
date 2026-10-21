package persistent

import (
	"context"
	"task-trail/internal/domain/entity"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PGProjectMemberRepository struct {
	PgRepository
}

func NewProjectMemberRepo(db *pgxpool.Pool) *PGProjectMemberRepository {
	return &PGProjectMemberRepository{PgRepository: PgRepository{pg: db}}
}

func (r *PGProjectMemberRepository) Add(ctx context.Context, m *entity.ProjectMember) error {
	return r.insert(ctx, "project_members", map[string]any{
		"project_id": m.ProjectID,
		"user_id":    m.UserID,
		"role":       m.Role,
		"created_at": m.CreatedAt,
		"updated_at": m.UpdatedAt,
	})
}
