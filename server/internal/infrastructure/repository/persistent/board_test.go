package persistent_test

import (
	"context"
	"slices"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/test/clock"
	"task-trail/test/testdb"
)

var _ repository.BoardRepository = (*persistent.PGBoardRepository)(nil)

// A board view: the viewer's projects by name, the owner first among members; replacing projects
// keeps those the owner is not in; deleting a board removes its projects and members, tasks stay.
func TestBoardRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	clk := clock.New(now)
	repo := persistent.NewBoardRepo(pool, factory.NewUserFactory(id.New(), clk))
	f := factory.NewBoardFactory(id.New(), clk)
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	petr := createUser(t, pool, "petr@example.com", "Пётр")
	web, api, hidden := createProject(t, pool, "Веб"), createProject(t, pool, "API"), createProject(t, pool, "Скрытый")
	for _, p := range []entity.ProjectID{web, api} {
		if _, err := pool.Exec(ctx, `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`, p, anna.ID); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'member')`, hidden, ivan.ID); err != nil {
		t.Fatal(err)
	}
	task := insertTask(t, pool, web, anna, nil)

	board := f.New("Релиз", anna.ID)
	if err := repo.Create(ctx, board, []entity.ProjectID{web, api, hidden}); err != nil {
		t.Fatal(err)
	}
	if err := repo.AddMembers(ctx, board.ID, []entity.UserID{petr.ID}, now.Add(time.Minute)); err != nil {
		t.Fatal(err)
	}
	if err := repo.AddMembers(ctx, board.ID, []entity.UserID{ivan.ID, petr.ID}, now.Add(2*time.Minute)); err != nil {
		t.Fatal(err)
	}

	view, err := repo.GetView(ctx, board.ID, anna.ID)
	if err != nil {
		t.Fatal(err)
	}
	var projects []entity.ProjectID
	for _, p := range view.Projects {
		projects = append(projects, p.ID)
	}
	var members []entity.UserID
	for _, u := range view.Members {
		members = append(members, u.ID)
	}
	if !slices.Equal(projects, []entity.ProjectID{api, web}) || !slices.Equal(members, []entity.UserID{anna.ID, petr.ID, ivan.ID}) ||
		view.TasksCount != 1 {
		t.Fatalf("view: projects %v, members %v, tasks %d", projects, members, view.TasksCount)
	}
	if _, err := repo.GetView(ctx, board.ID, createUser(t, pool, "olga@example.com", "Ольга").ID); !domain.HasCode(err, domain.EntityNotFound) {
		t.Fatalf("non-member: %v", err)
	}

	if err := repo.ReplaceProjects(ctx, board.ID, anna.ID, []entity.ProjectID{api}); err != nil {
		t.Fatal(err)
	}
	var left []string
	rows, err := pool.Query(ctx, `SELECT project_id FROM board_projects WHERE board_id = $1 ORDER BY project_id`, board.ID)
	if err != nil {
		t.Fatal(err)
	}
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			t.Fatal(err)
		}
		left = append(left, p)
	}
	want := []string{string(api), string(hidden)}
	slices.Sort(want)
	if !slices.Equal(left, want) {
		t.Fatalf("projects after replacing: %v", left)
	}

	err = persistent.NewPgTxManager(pool).DoWithTx(ctx, func(ctx context.Context) error {
		if _, err := repo.GetForUpdate(ctx, board.ID); err != nil {
			return err
		}
		return repo.Delete(ctx, board.ID)
	})
	if err != nil {
		t.Fatal(err)
	}
	var rest int
	err = pool.QueryRow(ctx, `SELECT (SELECT count(*) FROM board_projects) + (SELECT count(*) FROM board_members) +
		(SELECT count(*) FROM boards) + (SELECT count(*) - 1 FROM tasks WHERE id = $1)`, task).Scan(&rest)
	if err != nil || rest != 0 {
		t.Fatalf("after deleting: %d rows left, %v", rest, err)
	}
}
