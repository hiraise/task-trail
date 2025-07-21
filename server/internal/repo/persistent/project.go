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
	return id, nil
}

func (r *PgProjectRepository) GetList(ctx context.Context, data *dto.ProjectList) ([]*dto.ProjectRes, error) {
	query := `
		SELECT P.id, P.name, P.description, P.created_at, COUNT(T.id)
		FROM projects as P 
		LEFT JOIN tasks as T on P.id = T.project_id
		WHERE P.id IN (SELECT DISTINCT project_id FROM project_role_user WHERE user_id = $1)
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

func (r *PgProjectRepository) AddMembers(ctx context.Context, data []*dto.ProjectAddMembersDB) error {
	var values []any
	var items []string
	index := 1
	for _, item := range data {
		values = append(values, item.ProjectID, item.MemberID, item.RoleID)
		items = append(items, fmt.Sprintf("($%d, $%d, $%d)", index, index+1, index+2))
		index += 3
	}
	query := fmt.Sprintf(`
		INSERT INTO project_role_user 
		(project_id, user_id, role_id)
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
		SELECT id, email FROM users WHERE id IN (SELECT DISTINCT user_id FROM project_role_user WHERE project_id = $1);
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
				SELECT DISTINCT user_id
				FROM project_role_user
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
				FROM project_role_user
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
		LEFT JOIN tasks as T on P.id = T.project_id
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
	query := `SELECT 1 FROM project_role_user where project_id = $1 and user_id = $2`
	tag, err := r.getDb(ctx).Exec(ctx, query, projectID, memberID)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return repo.ErrNotFound
	}
	return nil
}

func (r *PgProjectRepository) CreateRoles(
	ctx context.Context,
	projectID int,
	roles []dto.ProjectRoleCreate,
) ([]*dto.ProjectRoleRes, error) {
	var subs []string
	values := []any{projectID}

	for i, role := range roles {
		values = append(values, role.Name)
		subs = append(subs, fmt.Sprintf("($1, $%d)", i+2))
	}

	query := fmt.Sprintf(`
		INSERT INTO project_roles (project_id, name)
		VALUES
		%s
		RETURNING id, name;
	`, strings.Join(subs, ",\n"))
	rows, err := r.getDb(ctx).Query(ctx, query, values...)
	if err != nil {
		return nil, r.handleError(err)
	}
	newRoles, err := ScanRows(rows, func(r pgx.Rows) (*dto.ProjectRoleRes, error) {
		var item dto.ProjectRoleRes
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}
		return &item, err
	})

	if err != nil {
		return nil, r.handleError(err)
	}
	return newRoles, nil
}

func (r *PgProjectRepository) AppendPermissions(ctx context.Context, roleID int, permissions []string) error {
	query := `
		INSERT INTO project_role_permission (role_id, permission_id)
		SELECT $1, P.id
		FROM permissions as P
		WHERE 
			P.id IN 
			(
				SELECT id 
				FROM permissions
				WHERE name = ANY ($2)
			);`
	tag, err := r.getDb(ctx).Exec(ctx, query, roleID, permissions)
	if err != nil {
		return r.handleError(err)
	}
	if int(tag.RowsAffected()) != len(permissions) {
		return repo.Wrap(fmt.Errorf("passed permmissions not found in db"), repo.ErrNotFound)
	}
	return nil
}

func (r *PgProjectRepository) GetProjectRoles(ctx context.Context, projectID int) ([]*dto.ProjectRoleRes, error) {
	query := `
		SELECT id, name
		FROM project_roles
		WHERE project_id = $1;
	`

	rows, err := r.getDb(ctx).Query(ctx, query, projectID)
	if err != nil {
		return nil, r.handleError(err)
	}

	items, err := ScanRows(rows, func(r pgx.Rows) (*dto.ProjectRoleRes, error) {
		var item dto.ProjectRoleRes
		if err := r.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}
		return &item, nil
	})

	if err != nil {
		return nil, r.handleError(err)
	}
	return items, nil
}
