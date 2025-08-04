//go:build integration

package persistent

import (
	"context"
	"fmt"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"testing"

	"github.com/stretchr/testify/require"
)

const testRole = "t1"
const testRole1 = "t2"
const testPermissionCandidates = "p1"

type testData struct {
	OwnerID   int
	ProjectID int
	Roles     []*dto.ProjectRoleRes
}

func (d *testData) AddProject(t *testing.T) *testData {
	id, err := projectRepo.Create(t.Context(), "Test", "Test")
	require.NoError(t, err)
	d.ProjectID = id
	return d
}

func (d *testData) AddRolesToProject(t *testing.T) *testData {
	roles, err := projectRepo.CreateRoles(t.Context(), d.ProjectID, []dto.ProjectRoleCreate{
		{
			Name: testRole,
		},
		{
			Name: testRole1,
		},
	})
	require.NoError(t, err)
	_, err = projectRepo.pg.Exec(t.Context(), `INSERT INTO permissions (name, description) VALUES ($1, 'test') ON CONFLICT DO NOTHING;`, testPermissionCandidates)
	require.NoError(t, err)
	err = projectRepo.AppendPermissions(t.Context(), roles[0].ID, []string{testPermissionCandidates})
	require.NoError(t, err)
	d.Roles = roles
	return d
}

func (d *testData) AddOwnerToProject(t *testing.T, ownerID int) *testData {
	d.OwnerID = ownerID
	txManager.DoWithTx(t.Context(), func(ctx context.Context) error {
		err := projectRepo.AddMembers(ctx, []*dto.ProjectAddMembersDB{
			{
				ProjectID: d.ProjectID,
				MemberID:  d.OwnerID,
				RoleID:    d.Roles[0].ID,
			},
		})
		require.NoError(t, err)
		return nil
	})
	return d
}

func (d *testData) AddMemberToProject(t *testing.T, memberID int) *testData {
	txManager.DoWithTx(t.Context(), func(ctx context.Context) error {
		err := projectRepo.AddMembers(ctx, []*dto.ProjectAddMembersDB{
			{
				ProjectID: d.ProjectID,
				MemberID:  memberID,
				RoleID:    d.Roles[1].ID,
			},
		})
		require.NoError(t, err)
		return nil
	})
	return d
}

func inTx(t *testing.T, f func(ctx context.Context)) {
	err := txManager.DoWithTx(t.Context(), func(ctx context.Context) error {
		f(ctx)
		return fmt.Errorf("rollback")
	})
	require.EqualError(t, err, "rollback")
}
func TestProjectCreate(t *testing.T) {
	cleanDB(t)
	t.Run("success", func(t *testing.T) {
		id, err := projectRepo.Create(t.Context(), "Test", "Test")
		require.NoError(t, err)
		require.Equal(t, 1, id)
	})

	t.Run("database internal error", func(t *testing.T) {
		id, err := projectRepo.Create(getBadContext(t), "Test", "Test")
		require.ErrorIs(t, err, repo.ErrInternal)
		require.Equal(t, 0, id)
	})
}

func TestProjectGetList(t *testing.T) {
	cleanDB(t)
	memberID := mustAddUser(t, testEmail)
	memberID1 := mustAddUser(t, testEmail1)
	td1 := testData{}
	td2 := testData{}
	td1.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, memberID)
	td2.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, memberID1)
	td2.AddMemberToProject(t, td1.OwnerID)
	dto := dto.ProjectList{
		MemberID: 1,
	}
	t.Run("success", func(t *testing.T) {
		projects, err := projectRepo.GetList(t.Context(), &dto)
		require.NoError(t, err)
		require.Equal(t, len(projects), 2)
	})
	t.Run("not found any project", func(t *testing.T) {
		dto := dto
		dto.MemberID = 5
		projects, err := projectRepo.GetList(t.Context(), &dto)
		require.NoError(t, err)
		require.Equal(t, len(projects), 0)
	})
	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.GetList(getBadContext(t), &dto)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestProjectAddMembers(t *testing.T) {
	cleanDB(t)
	td := testData{}
	td.AddProject(t).AddRolesToProject(t)
	id1 := mustAddUser(t, testEmail1)
	id2 := mustAddUser(t, testEmail2)
	data := []*dto.ProjectAddMembersDB{
		{
			MemberID:  id1,
			ProjectID: td.ProjectID,
			RoleID:    td.Roles[0].ID,
		},
		{
			MemberID:  id2,
			ProjectID: td.ProjectID,
			RoleID:    td.Roles[1].ID,
		},
	}
	t.Run("success", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.AddMembers(ctx, data)
			require.NoError(t, err)
			require.NoError(t, projectRepo.IsMember(ctx, 1, id1))
			require.NoError(t, projectRepo.IsMember(ctx, 1, id2))
		})
	})
	t.Run("without tx", func(t *testing.T) {
		err := projectRepo.AddMembers(t.Context(), data)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
	t.Run("alredy exists", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.AddMembers(ctx, data)
			require.NoError(t, err)
			require.NoError(t, projectRepo.IsMember(ctx, 1, id1))
			require.NoError(t, projectRepo.IsMember(ctx, 1, id2))
			err = projectRepo.AddMembers(ctx, data)
			require.ErrorIs(t, err, repo.ErrConflict)
		})
	})
	t.Run("project not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			dd := data
			dd[0].ProjectID = 2
			err := projectRepo.AddMembers(ctx, dd)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})
	t.Run("project deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			dd := data
			id, _ := projectRepo.Create(ctx, "ttt", "ttt")
			dd[0].ProjectID = id
			dd[1].ProjectID = id
			_ = projectRepo.Delete(ctx, id)

			err := projectRepo.AddMembers(ctx, dd)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})
	t.Run("member not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			dd := data
			dd[0].MemberID = 99
			err := projectRepo.AddMembers(ctx, dd)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})

	})
	t.Run("role not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			dd := data
			dd[0].RoleID = 99
			err := projectRepo.AddMembers(ctx, dd)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})

	})
	t.Run("database internal error", func(t *testing.T) {
		err := projectRepo.AddMembers(getBadContext(t), data)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestProjectGetMembers(t *testing.T) {
	cleanDB(t)
	td := testData{}
	id1 := mustAddUser(t, testEmail)
	id2 := mustAddUser(t, testEmail1)
	id3 := mustAddUser(t, testEmail2)
	// first user has owner and member role
	td.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, id1).AddMemberToProject(t, id1).AddMemberToProject(t, id2).AddMemberToProject(t, id3)

	t.Run("success", func(t *testing.T) {
		res, err := projectRepo.GetMembers(t.Context(), 1)
		require.NoError(t, err)
		require.Equal(t, 3, len(res))
	})
	t.Run("success, but one user was deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := userRepo.Delete(ctx, id2)
			require.NoError(t, err)
			res, err := projectRepo.GetMembers(ctx, 1)
			require.NoError(t, err)
			require.Equal(t, 2, len(res))
		})
	})
	t.Run("success, but project was deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Delete(ctx, 1)
			require.NoError(t, err)
			res, err := projectRepo.GetMembers(ctx, 1)
			require.NoError(t, err)
			require.Equal(t, 0, len(res))
		})
	})
	t.Run("success, but one role was deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Delete(ctx, 1)
			require.NoError(t, err)
			res, err := projectRepo.GetMembers(ctx, 1)
			require.NoError(t, err)
			require.Equal(t, 0, len(res))
		})
	})

	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.GetMembers(getBadContext(t), 1)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestProjectGetCandidates(t *testing.T) {
	cleanDB(t)
	oldProject := testData{}
	id1 := mustAddUser(t, testEmail)
	id2 := mustAddUser(t, testEmail1)
	id3 := mustAddUser(t, testEmail2)
	// first user has owner and member role
	oldProject.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, id1).AddMemberToProject(t, id2).AddMemberToProject(t, id3)
	newProject := testData{}
	newProject.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, id1).AddMemberToProject(t, id2)
	t.Run("success, without project", func(t *testing.T) {
		res, err := projectRepo.GetCandidates(t.Context(), 1, 0, testPermissionCandidates)
		require.NoError(t, err)

		require.NoError(t, err)
		require.Equal(t, 2, len(res))
	})
	t.Run("success, with project", func(t *testing.T) {
		res, err := projectRepo.GetCandidates(t.Context(), 1, 2, testPermissionCandidates)
		require.NoError(t, err)

		require.NoError(t, err)
		require.Equal(t, 1, len(res))
	})
}
