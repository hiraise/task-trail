package persistent

import (
	"context"
	"fmt"
	"strings"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PgProjectRepository struct {
	PgRepostitory
}

func NewProjectRepo(db *pgxpool.Pool) *PgProjectRepository {
	return &PgProjectRepository{PgRepostitory{pg: db}}
}

func (r *PgProjectRepository) Create(ctx context.Context, name string, description string) (int, error) {
	query := `
		INSERT INTO projects
		(name, description)
		VALUES ($1, $2)
		RETURNING id;`
	var id int
	err := r.getDb(ctx).QueryRow(ctx, query, name, description).Scan(&id)
	if err != nil {
		return 0, r.handleError(err)
	}
	return id, nil
}

func (r *PgProjectRepository) GetList(ctx context.Context, data *dto.ProjectList) ([]*dto.ProjectListRes, error) {
	query := `
		SELECT P.id, P.name, P.description, P.created_at, COUNT(T.id)
		FROM projects as P 
		LEFT JOIN tasks as T on P.id = T.project_id
		WHERE P.id IN (SELECT DISTINCT project_id FROM project_role_user WHERE user_id = $1) AND p.deleted_at IS NULL
		GROUP BY (P.id)
	`
	rows, err := r.getDb(ctx).Query(ctx, query, data.MemberID)
	if err != nil {
		return nil, r.handleError(err)
	}

	retVal, err := ScanRows(rows, func(row pgx.Rows) (*dto.ProjectListRes, error) {
		var item dto.ProjectListRes
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

// func (r *PgProjectRepository) GetOwned(ctx context.Context, projectID int, ownerID int, roleName string) (*dto.Project, error) {
// 	query := `
// 		SELECT id, name, description, created_at
// 		FROM projects AS P
// 		WHERE P.id = $1
// 		AND EXISTS (
// 			SELECT 1
// 			FROM project_role_user AS PRU
// 			JOIN project_roles AS PR ON PRU.role_id = PR.id
// 			WHERE PRU.project_id = P.id
// 			AND PRU.user_id = $2
// 			AND PR.name = $3
// 			AND PR.project_id = P.id
//   	);`
// 	var item dto.Project
// 	err := r.getDb(ctx).
// 		QueryRow(ctx, query, projectID, ownerID, roleName).
// 		Scan(&item.ID, &item.Name, &item.Description, &item.CreatedAt)
// 	if err != nil {
// 		return nil, r.handleError(err)
// 	}

// 	return &item, nil

// }

func (r *PgProjectRepository) GetMembers(ctx context.Context, projectID int) ([]*dto.ProjectMember, error) {
	query := `
		SELECT DISTINCT U.id, U.email, U.username, PR.name
		FROM project_role_user AS PRU
		JOIN projects AS p ON p.id = pru.project_id
		JOIN project_roles AS PR ON PR.id = PRU.role_id
		JOIN users AS U ON U.id = PRU.user_id
		WHERE PRU.project_id = $1 AND p.deleted_at IS NULL;
		`
	rows, err := r.getDb(ctx).Query(ctx, query, projectID)
	if err != nil {
		return nil, r.handleError(err)
	}

	members, err := ScanRows(rows, func(r pgx.Rows) (*dto.ProjectMember, error) {
		var item dto.ProjectMember
		if err := r.Scan(&item.ID, &item.Email, &item.Username, &item.Role); err != nil {
			return nil, err
		}
		return &item, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return members, nil
}

func (r *PgProjectRepository) GetCandidates(ctx context.Context, ownerID int, projectID int, roleName string) ([]*dto.UserSimple, error) {
	subquery := `u.id != $1;`
	values := []any{ownerID, roleName}
	if projectID != 0 {
		subquery = `
			u.id NOT IN (
				SELECT DISTINCT user_id
				FROM project_role_user
				WHERE project_id = $3
			);
		`
		values = append(values, projectID)
	}
	query := fmt.Sprintf(`
		SELECT DISTINCT u.id, u.email, u.username 
		FROM project_role_user AS pru
		JOIN users AS u ON u.id = pru.user_id 
		WHERE 
			pru.project_id IN (
				SELECT pru.project_id 
				FROM project_role_user AS pru 
				JOIN project_roles AS pr ON pr.id = pru.role_id
				JOIN projects AS p ON p.id = pru.project_id
				WHERE pru.user_id = $1 AND pr.name = $2 AND p.deleted_at IS NULL
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
		return &item, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return items, nil

}

func (r *PgProjectRepository) GetByID(ctx context.Context, projectID int) (*dto.ProjectListRes, error) {
	query := `
		SELECT P.id, P.name, P.description, P.created_at, COUNT(T.ID)
		FROM projects as P
		LEFT JOIN tasks as T on P.id = T.project_id
		WHERE P.id = $1 AND P.deleted_at IS NULL
		GROUP BY (P.id)
	`
	var item dto.ProjectListRes
	if err := r.getDb(ctx).QueryRow(ctx, query, projectID).Scan(&item.ID, &item.Name, &item.Description, &item.CreatedAt, &item.TaskCount); err != nil {
		return nil, r.handleError(err)
	}
	return &item, nil

}

func (r *PgProjectRepository) IsMember(ctx context.Context, projectID int, memberID int) error {
	query := `SELECT 1 
	FROM project_role_user AS pru
	JOIN projects AS p ON p.id = pru.project_id
	WHERE pru.project_id = $1 AND pru.user_id = $2 AND p.deleted_at IS NULL`
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
		return &item, nil
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
		SELECT pr.id, pr.name
		FROM project_roles AS pr
		JOIN projects AS p ON p.ID = pr.project_id
		WHERE pr.project_id = $1 AND p.deleted_at IS NULL;
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

func (r *PgProjectRepository) HasPermission(ctx context.Context, projectID int, memberID int, permission string) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM project_role_user AS pru
			JOIN project_roles AS pr ON pr.id = pru.role_id
			JOIN project_role_permission AS prp ON prp.role_id = pr.id
			JOIN permissions AS p ON p.id = prp.permission_id
			JOIN projects AS pro ON pro.id = pru.project_id
			WHERE pru.project_id = $1
				AND pru.user_id = $2
				AND p.name = $3
				AND pro.deleted_at IS null
		);`
	var result bool
	if err := r.getDb(ctx).QueryRow(ctx, query, projectID, memberID, permission).Scan(&result); err != nil {
		return false, r.handleError(err)
	}
	return result, nil
}

func (r *PgProjectRepository) GetMemberRights(ctx context.Context, projectID int, memberID int) ([]*dto.ProjectRights, error) {
	query := `
		SELECT p.name, pr.name
		FROM project_role_user AS pru
		JOIN project_roles AS pr ON pr.id = pru.role_id
		JOIN project_role_permission AS prp ON prp.role_id = pr.id
		JOIN permissions AS p ON p.id = prp.permission_id
		JOIN projects AS pro ON pro.id = pru.project_id
		WHERE pru.project_id = $1 AND pru.user_id = $2 AND pro.deleted_at IS null;
	`
	rows, err := r.getDb(ctx).Query(ctx, query, projectID, memberID)
	if err != nil {
		return nil, r.handleError(err)
	}

	items := make(map[string][]string)
	_, err = ScanRows(rows, func(row pgx.Rows) (*interface{}, error) {
		var role, permission string
		if err := rows.Scan(&permission, &role); err != nil {
			return nil, err
		}
		items[role] = append(items[role], permission)
		return nil, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	var retVal []*dto.ProjectRights
	for k, v := range items {
		retVal = append(retVal, &dto.ProjectRights{Role: k, Permissions: v})
	}
	return retVal, nil

}

func (r *PgProjectRepository) Update(ctx context.Context, projectID int, data *dto.ProjectUpdate) error {

	kwargs := make(map[string]any)
	if data.Name != "" {
		kwargs["name"] = data.Name
	}

	if data.Description != "" {
		kwargs["description"] = data.Description
	}
	if len(kwargs) == 0 {
		return nil
	}
	return r.updateByID(ctx, "projects", projectID, kwargs)
}

func (r *PgProjectRepository) Delete(ctx context.Context, projectID int) error {
	if err := r.updateByID(ctx, "projects", projectID, map[string]any{"deleted_at": time.Now()}); err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PgProjectRepository) Archive(ctx context.Context, projectID int) error {
	if err := r.updateByID(ctx, "projects", projectID, map[string]any{"archived_at": time.Now()}); err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PgProjectRepository) Unarchive(ctx context.Context, projectID int) error {
	if err := r.updateByID(ctx, "projects", projectID, map[string]any{"archived_at": nil}); err != nil {
		return r.handleError(err)
	}
	return nil
}
