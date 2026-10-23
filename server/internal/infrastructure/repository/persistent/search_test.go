package persistent_test

import (
	"context"
	"slices"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/test/clock"
	"task-trail/test/testdb"

	"github.com/jackc/pgx/v5/pgxpool"
)

// searchProject inserts a project with a given key and makes userID its member.
func searchProject(t *testing.T, pool *pgxpool.Pool, name, key string, member entity.UserID) entity.ProjectID {
	t.Helper()
	ctx := context.Background()
	projectID := id.New().Generate()
	if _, err := pool.Exec(ctx, `INSERT INTO projects (id, name, key) VALUES ($1, $2, $3)`, projectID, name, key); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`, projectID, member); err != nil {
		t.Fatal(err)
	}
	return entity.ProjectID(projectID)
}

// searchTask inserts a task with a given number, name and description, updated at updated.
func searchTask(t *testing.T, pool *pgxpool.Pool, project entity.ProjectID, author entity.UserID, number int, name string, description *string, updated time.Time) string {
	t.Helper()
	taskID := id.New().Generate()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO tasks (id, project_id, number, author_id, name, description, status, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, 'open', $7)`,
		taskID, project, number, author, name, description, updated)
	if err != nil {
		t.Fatal(err)
	}
	return taskID
}

// Search (ADR-0030): only what the viewer sees, case-insensitive in Latin and Cyrillic, % and _ as
// characters, archived items included, the exact key first, at most limit.
func TestSearch(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	clk := clock.New(now)
	projects, tasks := persistent.NewProjectRepo(pool), persistent.NewTaskRepo(pool)
	boards := persistent.NewBoardRepo(pool, factory.NewUserFactory(id.New(), clk))
	boardFactory := factory.NewBoardFactory(id.New(), clk)
	anna := createUser(t, pool, "anna@example.com", "Анна").ID
	olga := createUser(t, pool, "olga@example.com", "Ольга").ID

	alpha := searchProject(t, pool, "Проект Альфа", "DS", anna)
	beta := searchProject(t, pool, "Beta 50%_off", "BT", anna)
	hidden := searchProject(t, pool, "Альфа Ольги", "OL", olga)
	if _, err := pool.Exec(ctx, `UPDATE projects SET archived_at = $2 WHERE id = $1`, beta, now); err != nil {
		t.Fatal(err)
	}
	for _, b := range []struct {
		name  string
		owner entity.UserID
		proj  entity.ProjectID
	}{{"Доска альфа", anna, alpha}, {"Альфа Ольги", olga, hidden}, {"Релиз", anna, beta}} {
		if err := boards.Create(ctx, boardFactory.New(b.name, b.owner), []entity.ProjectID{b.proj}); err != nil {
			t.Fatal(err)
		}
	}

	ds12 := searchTask(t, pool, alpha, anna, 12, "Сверстать шапку", nil, now)
	ds120 := searchTask(t, pool, alpha, anna, 120, "Логотип", nil, now.Add(time.Hour))
	described := searchTask(t, pool, alpha, anna, 3, "Без слова", ptr("про АЛЬФУ и DS-12"), now.Add(2*time.Hour))
	percent := searchTask(t, pool, beta, anna, 1, "Скидка 50%", nil, now)
	underscore := searchTask(t, pool, beta, anna, 2, "snake_case", nil, now)
	searchTask(t, pool, beta, anna, 3, "Скидка 500", nil, now)
	searchTask(t, pool, beta, anna, 4, "snakeXcase", nil, now)
	searchTask(t, pool, hidden, olga, 1, "Альфа DS-12", nil, now)
	deleted := searchTask(t, pool, alpha, anna, 4, "Альфа удалена", nil, now)
	if _, err := pool.Exec(ctx, `UPDATE tasks SET deleted_at = $2 WHERE id = $1`, deleted, now); err != nil {
		t.Fatal(err)
	}

	projectNames := func(pattern string) []string {
		t.Helper()
		views, err := projects.Search(ctx, anna, pattern, 20)
		if err != nil {
			t.Fatal(err)
		}
		names := []string{}
		for _, v := range views {
			names = append(names, v.Project.Name)
		}
		return names
	}
	if got := projectNames("%альф%"); !slices.Equal(got, []string{"Проект Альфа"}) {
		t.Fatalf("projects by Cyrillic name: %v", got)
	}
	if got := projectNames("%bt%"); !slices.Equal(got, []string{"Beta 50%_off"}) {
		t.Fatalf("an archived project by key: %v", got)
	}
	if got := projectNames(`%\%\_%`); !slices.Equal(got, []string{"Beta 50%_off"}) {
		t.Fatalf("projects by %%_: %v", got)
	}
	if got := projectNames("%"); !slices.Equal(got, []string{"Beta 50%_off", "Проект Альфа"}) {
		t.Fatalf("projects by name: %v", got)
	}

	boardViews, err := boards.Search(ctx, anna, "%АЛЬФА%", 20)
	if err != nil {
		t.Fatal(err)
	}
	if len(boardViews) != 1 || boardViews[0].Board.Name != "Доска альфа" || len(boardViews[0].Projects) != 1 {
		t.Fatalf("boards: %+v", boardViews)
	}

	taskIDs := func(pattern string, key *repository.TaskKeyQuery, limit int) []string {
		t.Helper()
		found, err := tasks.Search(ctx, anna, pattern, key, limit)
		if err != nil {
			t.Fatal(err)
		}
		ids := []string{}
		for _, task := range found {
			ids = append(ids, string(task.ID))
		}
		return ids
	}
	key := &repository.TaskKeyQuery{Key: "DS", Number: 12}
	if got := taskIDs("%ds-12%", key, 20); !slices.Equal(got, []string{ds12, described, ds120}) {
		t.Fatalf("tasks by key: %v, want %v", got, []string{ds12, described, ds120})
	}
	if got := taskIDs("%ds-12%", nil, 20); !slices.Equal(got, []string{described, ds120, ds12}) {
		t.Fatalf("tasks without a key: %v", got)
	}
	if got := taskIDs("%ds-12%", key, 1); !slices.Equal(got, []string{ds12}) {
		t.Fatalf("limit keeps the exact key: %v", got)
	}
	if got := taskIDs("%альф%", nil, 20); !slices.Equal(got, []string{described}) {
		t.Fatalf("tasks by description: %v", got)
	}
	if got := taskIDs(`%50\%%`, nil, 20); !slices.Equal(got, []string{percent}) {
		t.Fatalf("tasks by %%: %v", got)
	}
	if got := taskIDs(`%e\_c%`, nil, 20); !slices.Equal(got, []string{underscore}) {
		t.Fatalf("tasks by _: %v", got)
	}
	found, err := tasks.Search(ctx, anna, "%скидка 50\\%%", nil, 20)
	if err != nil || len(found) != 1 || !found[0].ProjectArchived || found[0].ProjectKey != "BT" {
		t.Fatalf("a task of an archived project: %+v, %v", found, err)
	}
}
