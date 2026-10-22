package persistent

import (
	"context"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGProjectMemberRepository struct {
	PgRepository
	userFactory *factory.UserFactory
}

func NewProjectMemberRepo(db *pgxpool.Pool, userFactory *factory.UserFactory) *PGProjectMemberRepository {
	return &PGProjectMemberRepository{PgRepository: PgRepository{pg: db}, userFactory: userFactory}
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

func (r *PGProjectMemberRepository) Get(ctx context.Context, projectID entity.ProjectID, userID entity.UserID) (*entity.ProjectMember, error) {
	query := `
		SELECT m.role, m.created_at, m.updated_at
		FROM project_members m
		JOIN projects p ON p.id = m.project_id AND p.deleted_at IS NULL
		WHERE m.project_id = $1 AND m.user_id = $2`
	m := &entity.ProjectMember{ProjectID: projectID, UserID: userID}
	var role string
	if err := r.getDb(ctx).QueryRow(ctx, query, projectID, userID).Scan(&role, &m.CreatedAt, &m.UpdatedAt); err != nil {
		return nil, r.handleError(err)
	}
	m.Role = entity.ProjectRole(role)
	return m, nil
}

func (r *PGProjectMemberRepository) List(ctx context.Context, projectID entity.ProjectID) ([]*repository.MemberView, error) {
	query := `
		SELECT ` + userColumnsOf("u") + `, m.role, m.created_at, m.updated_at
		FROM project_members m
		JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
		JOIN projects p ON p.id = m.project_id AND p.deleted_at IS NULL
		WHERE m.project_id = $1
		ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, m.created_at, u.id`
	rows, err := r.getDb(ctx).Query(ctx, query, projectID)
	if err != nil {
		return nil, r.handleError(err)
	}
	members, err := ScanRows(rows, func(row pgx.Rows) (*repository.MemberView, error) {
		m := &entity.ProjectMember{ProjectID: projectID}
		var role string
		user, err := scanUser(row, r.userFactory, &role, &m.CreatedAt, &m.UpdatedAt)
		if err != nil {
			return nil, err
		}
		m.UserID = user.ID
		m.Role = entity.ProjectRole(role)
		return &repository.MemberView{User: user, Member: m}, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return members, nil
}

func (r *PGProjectMemberRepository) UpdateRole(ctx context.Context, m *entity.ProjectMember) error {
	tag, err := r.getDb(ctx).Exec(ctx,
		`UPDATE project_members SET role = $3, updated_at = $4 WHERE project_id = $1 AND user_id = $2`,
		m.ProjectID, m.UserID, m.Role, m.UpdatedAt)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "projectID", m.ProjectID, "userID", m.UserID)
	}
	return nil
}

func (r *PGProjectMemberRepository) Remove(ctx context.Context, projectID entity.ProjectID, userID entity.UserID) error {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, projectID, userID)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "projectID", projectID, "userID", userID)
	}
	return nil
}
