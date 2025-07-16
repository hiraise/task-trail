package persistent

import (
	"context"
	"fmt"
	"strings"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PgProjectRepository struct {
	PgRepostitory
}

func NewProjectRepo(db *pgxpool.Pool) *PgProjectRepository {
	return &PgProjectRepository{PgRepostitory{pg: db}}
}

func (r *PgProjectRepository) Create(ctx context.Context, data *dto.ProjectCreate) (int, error) {
	query := `
		INSERT INTO projects
		(owner_id, name, description)
		VALUES ($1, $2, $3)
		RETURNING id;`
	var id int
	err := r.getDb(ctx).QueryRow(ctx, query, data.OwnerID, data.Name, data.Description).Scan(&id)
	if err != nil {
		return 0, r.handleError(err)
	}
	if err := r.AddMembers(ctx, &dto.ProjectAddMembersDB{ProjectID: id, MemberIDs: []int{data.OwnerID}}); err != nil {
		return 0, err
	}
	return id, nil
}

func (r *PgProjectRepository) GetList(ctx context.Context, data *dto.ProjectList) ([]*dto.ProjectRes, error) {
	query := `
		SELECT P.id, P.name, P.description, P.created_at, COUNT(T.id)
		FROM public.projects as P 
		LEFT JOIN public.tasks as T on P.id = T.project_id
		WHERE P.id IN (SELECT project_id FROM project_users WHERE user_id = $1)
		GROUP BY (P.id)
	`
	rows, err := r.getDb(ctx).Query(ctx, query, data.MemberID)
	if err != nil {
		return nil, r.handleError(err)
	}

	retVal, err := ScanRows(rows, func(row pgx.Rows) (*dto.ProjectRes, error) {
		var item dto.ProjectRes
		if err := row.Scan(
			&item.ID,
			&item.Name,
			&item.Description,
			&item.CreatedAt,
			&item.TaskCount,
		); err != nil {
			return nil, err
		}
		return &item, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return retVal, nil
}

func (r *PgProjectRepository) AddMembers(ctx context.Context, data *dto.ProjectAddMembersDB) error {
	values := make([]any, 0, len(data.MemberIDs)+1)
	values = append(values, data.ProjectID)
	var items []string
	for i, id := range data.MemberIDs {
		values = append(values, id)
		items = append(items, fmt.Sprintf("($%d, $1)", i+2))
	}
	query := fmt.Sprintf(`
		INSERT INTO project_users 
		(user_id, project_id)
		VALUES
		%s
		`, strings.Join(items, ",\n"))
	_, err := r.getDb(ctx).Exec(ctx, query, values...)
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PgProjectRepository) GetOwned(ctx context.Context, projectID int, ownerID int) (*dto.Project, error) {
	query := `
		SELECT id, name, description, owner_id, created_at FROM projects WHERE id = $1 AND owner_id = $2;
	`
	var item dto.Project
	err := r.getDb(ctx).QueryRow(ctx, query, projectID, ownerID).Scan(&item.ID, &item.Name, &item.Description, &item.OwnerID, &item.CreatedAt)
	if err != nil {
		return nil, r.handleError(err)
	}
	query = `
		SELECT id, email FROM users WHERE id IN (SELECT user_id FROM project_users WHERE project_id = $1);
		`
	rows, err := r.getDb(ctx).Query(ctx, query, projectID)
	if err != nil {
		return nil, r.handleError(err)
	}

	members, err := ScanRows(rows, func(r pgx.Rows) (*dto.UserEmailAndID, error) {
		var item dto.UserEmailAndID
		if err := r.Scan(&item.ID, &item.Email); err != nil {
			return nil, err
		}
		return &item, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	item.Members = members

	return &item, nil

}

func (r *PgProjectRepository) GetCandidates(ctx context.Context, ownerID int, projectID int) ([]*dto.UserSimple, error) {
	subquery := `id != $1;`
	values := []any{ownerID}
	if projectID != 0 {
		subquery = `
			id NOT IN (
				SELECT user_id
				FROM project_users
				WHERE project_id = $2
			);
		`
		values = append(values, projectID)
	}
	query := fmt.Sprintf(`
		SELECT 
			id,
			email,
			username 
		FROM users 
		WHERE 
			id IN (
				SELECT DISTINCT user_id 
				FROM project_users 
				WHERE project_id IN (
					SELECT id 
					FROM projects 
					WHERE owner_id = $1
				)
			)
			AND 
			%s
	`, subquery)

	rows, err := r.getDb(ctx).Query(ctx, query, values...)
	if err != nil {
		return nil, r.handleError(err)
	}

	items, err := ScanRows(rows, func(r pgx.Rows) (*dto.UserSimple, error) {
		var item dto.UserSimple
		if err := rows.Scan(&item.ID, &item.Email, &item.Username); err != nil {
			return nil, err
		}
		return &item, err
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return items, nil

}

func (r *PgProjectRepository) GetByID(ctx context.Context, projectID int) (*dto.ProjectRes, error) {
	query := `
		SELECT P.id, P.name, P.description, P.created_at, COUNT(T.ID)
		FROM projects as P
		LEFT JOIN public.tasks as T on P.id = T.project_id
		WHERE P.id = $1
		GROUP BY (P.id)
	`
	var item dto.ProjectRes
	if err := r.getDb(ctx).QueryRow(ctx, query, projectID).Scan(&item.ID, &item.Name, &item.Description, &item.CreatedAt, &item.TaskCount); err != nil {
		return nil, r.handleError(err)
	}
	return &item, nil

}

func (r *PgProjectRepository) IsMember(ctx context.Context, projectID int, memberID int) error {
	query := `SELECT 1 FROM project_users where project_id = $1 and user_id = $2`
	tag, err := r.getDb(ctx).Exec(ctx, query, projectID, memberID)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return repo.ErrNotFound
	}
	return nil
}
