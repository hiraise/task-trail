package persistent_test

import (
	"context"
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

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	_ repository.ProjectRepository = (*persistent.PGProjectRepository)(nil)
	_ repository.TaskRepository    = (*persistent.PGTaskRepository)(nil)
)

func insertTask(t *testing.T, pool *pgxpool.Pool, project entity.ProjectID, author, assignee *entity.UserAccount) string {
	t.Helper()
	taskID := id.New().Generate()
	var assigneeID *entity.UserID
	if assignee != nil {
		assigneeID = &assignee.ID
	}
	_, err := pool.Exec(context.Background(),
		`INSERT INTO tasks (id, project_id, number, author_id, assignee_id, name, status, updated_at)
		VALUES ($1, $2, (SELECT COALESCE(MAX(number), 0) + 1 FROM tasks WHERE project_id = $2), $3, $4, 'Задача', 'open', $5)`,
		taskID, project, author.ID, assigneeID, now)
	if err != nil {
		t.Fatal(err)
	}
	return taskID
}

// A project as a member sees it: the role and the number of non-deleted tasks; a deleted project, together
// with its tasks, is not found (ADR-0001), while membership in it is kept.
func TestProjectRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewProjectRepo(pool)
	members := persistent.NewProjectMemberRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
	clk := clock.New(now)
	f := factory.NewProjectFactory(id.New(), clk)
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")

	description := "Компоненты"
	design, owner := f.New("Дизайн-система", &description, "DS", anna.ID)
	clk.Advance(time.Minute)
	backend, backendOwner := f.New("Бэкенд", nil, "BE", anna.ID)
	for _, p := range []struct {
		project *entity.Project
		owner   *entity.ProjectMember
	}{{design, owner}, {backend, backendOwner}} {
		if err := repo.Create(ctx, p.project); err != nil {
			t.Fatal(err)
		}
		if err := members.Add(ctx, p.owner); err != nil {
			t.Fatal(err)
		}
	}
	if err := members.Add(ctx, entity.NewMember(design.ID, ivan.ID, now)); err != nil {
		t.Fatal(err)
	}
	insertTask(t, pool, design.ID, anna, nil)
	deleted := insertTask(t, pool, design.ID, anna, nil)
	if _, err := pool.Exec(ctx, `UPDATE tasks SET deleted_at = $1 WHERE id = $2`, now, deleted); err != nil {
		t.Fatal(err)
	}

	view, err := repo.GetView(ctx, design.ID, ivan.ID)
	if err != nil {
		t.Fatal(err)
	}
	if p := view.Project; p.ID != design.ID || p.Name != "Дизайн-система" || *p.Description != "Компоненты" ||
		p.Key != "DS" || p.ArchivedAt != nil || !p.CreatedAt.Equal(now) || view.TasksCount != 1 || view.Role != entity.RoleMember {
		t.Fatalf("project as Ivan sees it: %+v %+v", view, view.Project)
	}
	_, err = repo.GetView(ctx, backend.ID, ivan.ID)
	requireCode(t, err, domain.EntityNotFound)
	list, err := repo.ListViews(ctx, anna.ID, false)
	if err != nil || len(list) != 2 || list[0].Project.ID != backend.ID || list[1].Project.ID != design.ID ||
		list[0].Role != entity.RoleOwner || list[0].Project.Description != nil {
		t.Fatalf("Anna's projects: %+v, %v", list, err)
	}

	design.Rename("Дизайн-система 2", now.Add(time.Hour))
	design.Describe(nil, now.Add(time.Hour))
	design.ChangeKey("ДС", now.Add(time.Hour))
	if err := repo.Update(ctx, design); err != nil {
		t.Fatal(err)
	}
	if got, err := repo.GetForUpdate(ctx, design.ID); err != nil || got.Name != "Дизайн-система 2" || got.Description != nil || got.Key != "ДС" ||
		!got.UpdatedAt.Equal(now.Add(time.Hour)) {
		t.Fatalf("after update: %+v, %v", got, err)
	}

	// Archive (ADR-0027): lists by the project's flag; tasks archived on their own are not counted
	archivedTask := insertTask(t, pool, design.ID, anna, nil)
	if _, err := pool.Exec(ctx, `UPDATE tasks SET archived_at = $1 WHERE id = $2`, now, archivedTask); err != nil {
		t.Fatal(err)
	}
	design.Archive(now.Add(2 * time.Hour))
	if err := repo.Update(ctx, design); err != nil {
		t.Fatal(err)
	}
	if got, err := repo.GetForUpdate(ctx, design.ID); err != nil || got.ArchivedAt == nil || !got.ArchivedAt.Equal(now.Add(2*time.Hour)) {
		t.Fatalf("archived project: %+v, %v", got, err)
	}
	if list, err := repo.ListViews(ctx, anna.ID, false); err != nil || len(list) != 1 || list[0].Project.ID != backend.ID {
		t.Fatalf("Anna's active projects: %+v, %v", list, err)
	}
	if list, err := repo.ListViews(ctx, anna.ID, true); err != nil || len(list) != 1 || list[0].Project.ID != design.ID || list[0].TasksCount != 1 {
		t.Fatalf("Anna's archived projects: %+v, %v", list, err)
	}

	if err := repo.SoftDelete(ctx, design.ID, now); err != nil {
		t.Fatal(err)
	}
	requireCode(t, repo.SoftDelete(ctx, design.ID, now), domain.EntityNotFound)
	_, err = repo.NextTaskNumber(ctx, design.ID)
	requireCode(t, err, domain.EntityNotFound)
	_, err = repo.GetForUpdate(ctx, design.ID)
	requireCode(t, err, domain.EntityNotFound)
	_, err = repo.GetView(ctx, design.ID, anna.ID)
	requireCode(t, err, domain.EntityNotFound)
	requireCode(t, repo.Update(ctx, design), domain.EntityNotFound)
	_, err = members.Get(ctx, design.ID, ivan.ID)
	requireCode(t, err, domain.EntityNotFound)
	var liveTasks, kept int
	if err := pool.QueryRow(ctx, `SELECT
		(SELECT count(*) FROM tasks WHERE project_id = $1 AND deleted_at IS NULL),
		(SELECT count(*) FROM project_members WHERE project_id = $1)`, design.ID).Scan(&liveTasks, &kept); err != nil || liveTasks != 0 || kept != 2 {
		t.Fatalf("after delete: tasks %d, memberships %d, %v", liveTasks, kept, err)
	}
	if list, err := repo.ListViews(ctx, anna.ID, true); err != nil || len(list) != 0 {
		t.Fatalf("after delete: %+v, %v", list, err)
	}
}

// Members: owner, admins, members; the role changes, membership is deleted,
// a removed member is unassigned from tasks of this project only.
func TestProjectMembers(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewProjectMemberRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
	tasks := persistent.NewTaskRepo(pool)
	owner := createUser(t, pool, "owner@example.com", "Владелец")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	olga := createUser(t, pool, "olga@example.com", "Ольга")
	project := createProject(t, pool, "Дизайн-система")
	other := createProject(t, pool, "Бэкенд")
	for _, m := range []*entity.ProjectMember{
		entity.NewMember(project, ivan.ID, now),
		{ProjectID: project, UserID: owner.ID, Role: entity.RoleOwner, CreatedAt: now.Add(time.Minute), UpdatedAt: now},
		entity.NewMember(project, olga.ID, now.Add(2*time.Minute)),
	} {
		if err := repo.Add(ctx, m); err != nil {
			t.Fatal(err)
		}
	}
	olgaMember, err := repo.Get(ctx, project, olga.ID)
	if err != nil {
		t.Fatal(err)
	}
	olgaMember.Role, olgaMember.UpdatedAt = entity.RoleAdmin, now.Add(time.Hour)
	if err := repo.UpdateRole(ctx, olgaMember); err != nil {
		t.Fatal(err)
	}
	list, err := repo.List(ctx, project)
	if err != nil {
		t.Fatal(err)
	}
	var got []string
	for _, m := range list {
		got = append(got, string(m.Member.Role)+" "+string(m.User.Email))
		if m.User.ID != m.Member.UserID {
			t.Errorf("membership of the wrong user: %+v", m)
		}
	}
	if len(got) != 3 || got[0] != "owner owner@example.com" || got[1] != "admin olga@example.com" || got[2] != "member ivan@example.com" {
		t.Fatalf("members: %v", got)
	}

	assigned := insertTask(t, pool, project, owner, ivan)
	elsewhere := insertTask(t, pool, other, owner, ivan)
	if err := repo.Remove(ctx, project, ivan.ID); err != nil {
		t.Fatal(err)
	}
	requireCode(t, repo.Remove(ctx, project, ivan.ID), domain.EntityNotFound)
	unassigned, err := tasks.UnassignInProject(ctx, project, ivan.ID, now.Add(time.Hour))
	if err != nil {
		t.Fatal(err)
	}
	if len(unassigned) != 1 || string(unassigned[0]) != assigned {
		t.Errorf("unassigned tasks: %v, want [%s]", unassigned, assigned)
	}
	for task, want := range map[string]bool{assigned: false, elsewhere: true} {
		var hasAssignee bool
		if err := pool.QueryRow(ctx, `SELECT assignee_id IS NOT NULL FROM tasks WHERE id = $1`, task).Scan(&hasAssignee); err != nil || hasAssignee != want {
			t.Errorf("task %s: assignee %v, %v", task, hasAssignee, err)
		}
	}
	_, err = repo.Get(ctx, project, ivan.ID)
	requireCode(t, err, domain.EntityNotFound)
}

// Candidates are people from the user's non-deleted projects, except the user and the members in exclude.
func TestListCandidates(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo, _ := userRepo(pool)
	members := persistent.NewProjectMemberRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	petr := createUser(t, pool, "petr@example.com", "Пётр")
	olga := createUser(t, pool, "olga@example.com", "Ольга")
	if _, err := pool.Exec(ctx, `UPDATE users SET username = NULL WHERE id = $1`, petr.ID); err != nil {
		t.Fatal(err)
	}
	design := createProject(t, pool, "Дизайн-система")
	backend := createProject(t, pool, "Бэкенд")
	old := createProject(t, pool, "Старый")
	for project, users := range map[entity.ProjectID][]*entity.UserAccount{
		design: {anna, ivan}, backend: {anna, petr}, old: {anna, olga},
	} {
		for _, u := range users {
			if err := members.Add(ctx, entity.NewMember(project, u.ID, now)); err != nil {
				t.Fatal(err)
			}
		}
	}
	if _, err := pool.Exec(ctx, `UPDATE projects SET deleted_at = $1 WHERE id = $2`, now, old); err != nil {
		t.Fatal(err)
	}
	emails := func(exclude *entity.ProjectID) []entity.Email {
		t.Helper()
		users, err := repo.ListCandidates(ctx, anna.ID, exclude)
		if err != nil {
			t.Fatal(err)
		}
		var out []entity.Email
		for _, u := range users {
			out = append(out, u.Email)
		}
		return out
	}
	// Without a name, by email: Petr has no name and sorts as petr@example.com, before "Ivan"
	if got := emails(nil); len(got) != 2 || got[0] != petr.Email || got[1] != ivan.Email {
		t.Errorf("all candidates: %v", got)
	}
	if got := emails(&design); len(got) != 1 || got[0] != petr.Email {
		t.Errorf("into the design system: %v", got)
	}
}

// A key is unique among non-deleted projects: a taken one gives PROJECT_KEY_TAKEN on create and update,
// the key of a deleted project is free again (ADR-0026). Task numbers grow by one and are not reused.
func TestProjectKeys(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewProjectRepo(pool)
	f := factory.NewProjectFactory(id.New(), clock.New(now))
	anna := createUser(t, pool, "anna@example.com", "Анна")

	design, _ := f.New("Дизайн-система", nil, "DS", anna.ID)
	backend, _ := f.New("Бэкенд", nil, "BE", anna.ID)
	for _, p := range []*entity.Project{design, backend} {
		if err := repo.Create(ctx, p); err != nil {
			t.Fatal(err)
		}
	}
	twin, _ := f.New("Двойник", nil, "DS", anna.ID)
	requireCode(t, repo.Create(ctx, twin), domain.ProjectKeyTaken)
	backend.ChangeKey("DS", now)
	requireCode(t, repo.Update(ctx, backend), domain.ProjectKeyTaken)

	for want := 1; want <= 3; want++ {
		if got, err := repo.NextTaskNumber(ctx, design.ID); err != nil || got != want {
			t.Fatalf("task number %d: %d, %v", want, got, err)
		}
	}
	if got, err := repo.NextTaskNumber(ctx, backend.ID); err != nil || got != 1 {
		t.Fatalf("each project counts on its own: %d, %v", got, err)
	}

	if err := repo.SoftDelete(ctx, design.ID, now); err != nil {
		t.Fatal(err)
	}
	if err := repo.Create(ctx, twin); err != nil {
		t.Fatalf("the key of a deleted project is free: %v", err)
	}
}
