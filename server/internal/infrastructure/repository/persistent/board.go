package persistent

import (
	"context"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGBoardRepository struct {
	PgRepository
	userFactory *factory.UserFactory
}

func NewBoardRepo(db *pgxpool.Pool, userFactory *factory.UserFactory) *PGBoardRepository {
	return &PGBoardRepository{PgRepository: PgRepository{pg: db}, userFactory: userFactory}
}

func (r *PGBoardRepository) Create(ctx context.Context, b *entity.Board, projectIDs []entity.ProjectID) error {
	err := r.insert(ctx, "boards", map[string]any{
		"id":         b.ID,
		"name":       b.Name,
		"owner_id":   b.OwnerID,
		"created_at": b.CreatedAt,
		"updated_at": b.UpdatedAt,
	})
	if err != nil {
		return err
	}
	if err := r.AddMembers(ctx, b.ID, []entity.UserID{b.OwnerID}, b.CreatedAt); err != nil {
		return err
	}
	return r.addProjects(ctx, b.ID, projectIDs)
}

const boardColumns = `b.id, b.name, b.owner_id, b.created_at, b.updated_at`

func (r *PGBoardRepository) GetForUpdate(ctx context.Context, id entity.BoardID) (*entity.Board, error) {
	board, err := scanBoard(r.getDb(ctx).QueryRow(ctx, `SELECT `+boardColumns+` FROM boards b WHERE b.id = $1 FOR UPDATE`, id))
	if err != nil {
		return nil, r.handleError(err)
	}
	return board, nil
}

func (r *PGBoardRepository) IsMember(ctx context.Context, id entity.BoardID, userID entity.UserID) (bool, error) {
	var member bool
	err := r.getDb(ctx).QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2)`, id, userID).Scan(&member)
	if err != nil {
		return false, r.handleError(err)
	}
	return member, nil
}

// boardTasks is the FROM and WHERE of the tasks of board `board` that viewer @viewer sees (ADR-0029):
// the board projects where the viewer is a project member; neither the task nor its project is archived
// or deleted; the assignee is a board member or nobody.
func boardTasks(board string) string {
	return taskTables + `
		JOIN board_projects bp ON bp.project_id = t.project_id AND bp.board_id = ` + board + `
		JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = @viewer
		WHERE t.deleted_at IS NULL AND t.archived_at IS NULL AND p.deleted_at IS NULL AND p.archived_at IS NULL
			AND (t.assignee_id IS NULL OR EXISTS (
				SELECT 1 FROM board_members a WHERE a.board_id = ` + board + ` AND a.user_id = t.assignee_id
			))`
}

// boardViews selects boards where @viewer is a member, with the count of tasks they see.
var boardViews = `
	SELECT ` + boardColumns + `, (SELECT count(*)` + boardTasks("b.id") + `)
	FROM boards b
	JOIN board_members m ON m.board_id = b.id AND m.user_id = @viewer`

func (r *PGBoardRepository) GetView(ctx context.Context, id entity.BoardID, viewerID entity.UserID) (*repository.BoardView, error) {
	views, err := r.views(ctx, boardViews+` WHERE b.id = @board`, pgx.NamedArgs{"viewer": viewerID, "board": id})
	if err != nil {
		return nil, err
	}
	if len(views) == 0 {
		return nil, domain.ErrEntityNotFound(1, nil, "boardID", id, "viewerID", viewerID)
	}
	return views[0], nil
}

func (r *PGBoardRepository) ListViews(ctx context.Context, viewerID entity.UserID) ([]*repository.BoardView, error) {
	return r.views(ctx, boardViews+` ORDER BY b.created_at DESC, b.id`, pgx.NamedArgs{"viewer": viewerID})
}

// views reads boards with a boardViews query and fills their projects and members.
func (r *PGBoardRepository) views(ctx context.Context, query string, args pgx.NamedArgs) ([]*repository.BoardView, error) {
	rows, err := r.getDb(ctx).Query(ctx, query, args)
	if err != nil {
		return nil, r.handleError(err)
	}
	views, err := ScanRows(rows, func(row pgx.Rows) (*repository.BoardView, error) {
		view := &repository.BoardView{Projects: []repository.BoardProject{}, Members: []*entity.UserAccount{}}
		board, err := scanBoard(row, &view.TasksCount)
		view.Board = board
		return view, err
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	if len(views) == 0 {
		return views, nil
	}
	byID := make(map[entity.BoardID]*repository.BoardView, len(views))
	ids := make([]string, len(views))
	for i, v := range views {
		byID[v.Board.ID] = v
		ids[i] = string(v.Board.ID)
	}
	if err := r.fillProjects(ctx, byID, ids, args["viewer"]); err != nil {
		return nil, err
	}
	if err := r.fillMembers(ctx, byID, ids); err != nil {
		return nil, err
	}
	return views, nil
}

// fillProjects: non-deleted board projects where viewer is a project member, by name.
func (r *PGBoardRepository) fillProjects(ctx context.Context, byID map[entity.BoardID]*repository.BoardView, ids []string, viewer any) error {
	rows, err := r.getDb(ctx).Query(ctx, `
		SELECT bp.board_id, p.id, p.name, p.key, p.archived_at
		FROM board_projects bp
		JOIN projects p ON p.id = bp.project_id AND p.deleted_at IS NULL
		JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
		WHERE bp.board_id = ANY($1::uuid[])
		ORDER BY p.name, p.id`, ids, viewer)
	if err != nil {
		return r.handleError(err)
	}
	_, err = ScanRows(rows, func(row pgx.Rows) (*struct{}, error) {
		var boardID, projectID, key string
		var p repository.BoardProject
		if err := row.Scan(&boardID, &projectID, &p.Name, &key, &p.ArchivedAt); err != nil {
			return nil, err
		}
		p.ID, p.Key = entity.ProjectID(projectID), entity.ProjectKey(key)
		view := byID[entity.BoardID(boardID)]
		view.Projects = append(view.Projects, p)
		return nil, nil
	})
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

// fillMembers: board members, the owner first, the others in order of joining.
func (r *PGBoardRepository) fillMembers(ctx context.Context, byID map[entity.BoardID]*repository.BoardView, ids []string) error {
	rows, err := r.getDb(ctx).Query(ctx, `
		SELECT `+userColumnsOf("u")+`, m.board_id
		FROM board_members m
		JOIN boards b ON b.id = m.board_id
		JOIN users u ON u.id = m.user_id AND u.deleted_at IS NULL
		WHERE m.board_id = ANY($1::uuid[])
		ORDER BY m.user_id = b.owner_id DESC, m.created_at, u.id`, ids)
	if err != nil {
		return r.handleError(err)
	}
	_, err = ScanRows(rows, func(row pgx.Rows) (*struct{}, error) {
		var boardID string
		user, err := scanUser(row, r.userFactory, &boardID)
		if err != nil {
			return nil, err
		}
		view := byID[entity.BoardID(boardID)]
		view.Members = append(view.Members, user)
		return nil, nil
	})
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PGBoardRepository) Update(ctx context.Context, b *entity.Board) error {
	tag, err := r.getDb(ctx).Exec(ctx, `UPDATE boards SET name = $2, updated_at = $3 WHERE id = $1`, b.ID, b.Name, b.UpdatedAt)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "boardID", b.ID)
	}
	return nil
}

func (r *PGBoardRepository) ReplaceProjects(ctx context.Context, id entity.BoardID, ownerID entity.UserID, projectIDs []entity.ProjectID) error {
	_, err := r.getDb(ctx).Exec(ctx, `
		DELETE FROM board_projects bp
		WHERE bp.board_id = $1
			AND EXISTS (SELECT 1 FROM project_members m WHERE m.project_id = bp.project_id AND m.user_id = $2)`,
		id, ownerID)
	if err != nil {
		return r.handleError(err)
	}
	return r.addProjects(ctx, id, projectIDs)
}

func (r *PGBoardRepository) addProjects(ctx context.Context, id entity.BoardID, projectIDs []entity.ProjectID) error {
	_, err := r.getDb(ctx).Exec(ctx, `
		INSERT INTO board_projects (board_id, project_id)
		SELECT $1, unnest($2::uuid[])
		ON CONFLICT DO NOTHING`, id, toStrings(projectIDs))
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PGBoardRepository) AddMembers(ctx context.Context, id entity.BoardID, userIDs []entity.UserID, now time.Time) error {
	_, err := r.getDb(ctx).Exec(ctx, `
		INSERT INTO board_members (board_id, user_id, created_at)
		SELECT $1, unnest($2::uuid[]), $3
		ON CONFLICT DO NOTHING`, id, toStrings(userIDs), now)
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PGBoardRepository) RemoveMember(ctx context.Context, id entity.BoardID, userID entity.UserID) error {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM board_members WHERE board_id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "boardID", id, "userID", userID)
	}
	return nil
}

func (r *PGBoardRepository) Delete(ctx context.Context, id entity.BoardID) error {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM boards WHERE id = $1`, id)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "boardID", id)
	}
	return nil
}

func (r *PGBoardRepository) ListTasks(ctx context.Context, id entity.BoardID, viewerID entity.UserID) ([]*entity.Task, error) {
	query := `SELECT ` + taskColumns + boardTasks("@board") + ` ORDER BY t.updated_at DESC, t.id`
	rows, err := r.getDb(ctx).Query(ctx, query, pgx.NamedArgs{"board": id, "viewer": viewerID})
	if err != nil {
		return nil, r.handleError(err)
	}
	tasks, err := ScanRows(rows, func(row pgx.Rows) (*entity.Task, error) { return scanTask(row) })
	if err != nil {
		return nil, r.handleError(err)
	}
	return tasks, nil
}

// scanBoard reads the boardColumns columns and then extra.
func scanBoard(row pgx.Row, extra ...any) (*entity.Board, error) {
	var id, ownerID string
	b := &entity.Board{}
	if err := row.Scan(append([]any{&id, &b.Name, &ownerID, &b.CreatedAt, &b.UpdatedAt}, extra...)...); err != nil {
		return nil, err
	}
	b.ID, b.OwnerID = entity.BoardID(id), entity.UserID(ownerID)
	return b, nil
}

// toStrings turns IDs into strings for a uuid[] parameter.
func toStrings[T ~string](ids []T) []string {
	out := make([]string, len(ids))
	for i, id := range ids {
		out[i] = string(id)
	}
	return out
}
