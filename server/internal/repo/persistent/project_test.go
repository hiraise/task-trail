//go:build integration

package persistent

import (
	"context"
	"fmt"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"task-trail/internal/utils"
	"testing"

	"github.com/stretchr/testify/require"
)

const testRole = "t1"
const testRole1 = "t2"
const testPermissionCandidates = "p1"

type testData struct {
	Name        string
	Description string
	OwnerID     int
	ProjectID   int
	Roles       []*dto.ProjectRoleRes
}

func (d *testData) AddProject(t *testing.T) *testData {
	id, err := projectRepo.Create(t.Context(), "Test", "Test")
	require.NoError(t, err)
	d.ProjectID = id
	d.Name = "Test"
	d.Description = "Test"
	return d
}

func (d *testData) AddRolesToProject(t *testing.T) *testData {
	roles, err := projectRepo.CreateRoles(t.Context(), d.ProjectID, []string{testRole, testRole1})
	require.NoError(t, err)
	createPermission(t, testPermissionCandidates)
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
				UserID:    d.OwnerID,
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
				UserID:    memberID,
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

func createPermission(t *testing.T, permission string) {
	_, err := projectRepo.pg.Exec(t.Context(), `INSERT INTO permissions (name, description) VALUES ($1, 'test') ON CONFLICT DO NOTHING;`, permission)
	require.NoError(t, err)
}
func TestCreate(t *testing.T) {
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

func TestGetList(t *testing.T) {
	cleanDB(t)
	memberID := mustAddUser(t, testEmail)
	memberID1 := mustAddUser(t, testEmail1)
	td1 := testData{}
	td2 := testData{}
	td1.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, memberID)
	td2.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, memberID1)
	td2.AddMemberToProject(t, td1.OwnerID)
	data := dto.ProjectList{
		UserID: 1,
	}
	t.Run("success", func(t *testing.T) {
		projects, err := projectRepo.GetList(t.Context(), &data)
		require.NoError(t, err)
		require.Equal(t, len(projects), 2)
	})
	t.Run("not found any project", func(t *testing.T) {
		dto := data
		dto.UserID = 5
		projects, err := projectRepo.GetList(t.Context(), &dto)
		require.NoError(t, err)
		require.Equal(t, len(projects), 0)
	})
	t.Run("data is nil", func(t *testing.T) {
		_, err := projectRepo.GetList(t.Context(), nil)
		require.ErrorIs(t, err, repo.ErrValidation)
	})

	t.Run("wrong userID", func(t *testing.T) {
		_, err := projectRepo.GetList(t.Context(), &dto.ProjectList{UserID: 0})
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.GetList(getBadContext(t), &data)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestAddMembers(t *testing.T) {
	cleanDB(t)
	td := testData{}
	td.AddProject(t).AddRolesToProject(t)
	id1 := mustAddUser(t, testEmail1)
	id2 := mustAddUser(t, testEmail2)
	data := []*dto.ProjectAddMembersDB{
		{
			UserID:    id1,
			ProjectID: td.ProjectID,
			RoleID:    td.Roles[0].ID,
		},
		{
			UserID:    id2,
			ProjectID: td.ProjectID,
			RoleID:    td.Roles[1].ID,
		},
	}
	t.Run("success", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.AddMembers(ctx, data)
			require.NoError(t, err)
			require.NoError(t, projectRepo.VerifyMembership(ctx, 1, id1))
			require.NoError(t, projectRepo.VerifyMembership(ctx, 1, id2))
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
			require.NoError(t, projectRepo.VerifyMembership(ctx, 1, id1))
			require.NoError(t, projectRepo.VerifyMembership(ctx, 1, id2))
			err = projectRepo.AddMembers(ctx, data)
			require.ErrorIs(t, err, repo.ErrConflict)
		})
	})
	t.Run("project not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			dd := utils.CopySlice(data)
			dd[0].ProjectID = 2
			err := projectRepo.AddMembers(ctx, dd)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})
	t.Run("project deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			dd := utils.CopySlice(data)
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
			dd := utils.CopySlice(data)
			dd[0].UserID = 99
			err := projectRepo.AddMembers(ctx, dd)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})

	})
	t.Run("role not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			dd := utils.CopySlice(data)
			dd[0].RoleID = 99
			err := projectRepo.AddMembers(ctx, dd)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})

	})

	t.Run("data is nil or empty", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.AddMembers(ctx, nil)
			require.ErrorIs(t, err, repo.ErrValidation)
			err = projectRepo.AddMembers(ctx, []*dto.ProjectAddMembersDB{})
			require.ErrorIs(t, err, repo.ErrValidation)
		})
	})

	t.Run("wrong IDs", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			// userID
			badData := utils.CopySlice(data)
			badData[0].UserID = 0
			err := projectRepo.AddMembers(ctx, badData)
			require.ErrorIs(t, err, repo.ErrValidation)
			// projectID
			badData = utils.CopySlice(data)
			badData[0].ProjectID = 0
			err = projectRepo.AddMembers(ctx, badData)
			require.ErrorIs(t, err, repo.ErrValidation)
			// roleID
			badData = utils.CopySlice(data)
			badData[0].RoleID = 0
			err = projectRepo.AddMembers(ctx, badData)
			require.ErrorIs(t, err, repo.ErrValidation)
		})
	})
	t.Run("database internal error", func(t *testing.T) {
		err := projectRepo.AddMembers(getBadContext(t), data)
		require.ErrorIs(t, err, repo.ErrInternal)

	})
}

func TestGetMembers(t *testing.T) {
	cleanDB(t)
	p := testData{}
	id1 := mustAddUser(t, testEmail)
	id2 := mustAddUser(t, testEmail1)
	id3 := mustAddUser(t, testEmail2)
	// first user has owner and member role
	p.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, id1).AddMemberToProject(t, id1).AddMemberToProject(t, id2).AddMemberToProject(t, id3)

	t.Run("success", func(t *testing.T) {
		res, err := projectRepo.GetMembers(t.Context(), p.ProjectID)
		require.NoError(t, err)
		require.Equal(t, 3, len(res))
	})
	t.Run("success, but one user was deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := userRepo.Delete(ctx, id2)
			require.NoError(t, err)
			res, err := projectRepo.GetMembers(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Equal(t, 2, len(res))
		})
	})
	t.Run("success, but project was deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Delete(ctx, p.ProjectID)
			require.NoError(t, err)
			res, err := projectRepo.GetMembers(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Equal(t, 0, len(res))
		})
	})
	t.Run("success, but one role was deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.DeleteRoles(ctx, []int{p.Roles[1].ID})
			require.NoError(t, err)
			res, err := projectRepo.GetMembers(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Equal(t, 1, len(res))
		})
	})

	t.Run("wrong projectID", func(t *testing.T) {
		_, err := projectRepo.GetMembers(t.Context(), 0)
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.GetMembers(getBadContext(t), p.ProjectID)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestGetCandidates(t *testing.T) {
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
		res, err := projectRepo.GetCandidates(t.Context(), id1, testPermissionCandidates, 0)
		require.NoError(t, err)
		require.Equal(t, 2, len(res))
	})
	t.Run("success, with project", func(t *testing.T) {
		res, err := projectRepo.GetCandidates(t.Context(), id1, testPermissionCandidates, newProject.ProjectID)
		require.NoError(t, err)
		require.Equal(t, 1, len(res))
	})

	// user id2 was deleted and method found only user id3 from oldProject
	t.Run("success, one user was deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			userRepo.Delete(ctx, id2)
			res, err := projectRepo.GetCandidates(ctx, id1, testPermissionCandidates, 0)
			require.NoError(t, err)

			require.Equal(t, 1, len(res))
		})
	})
	// oldProject was deleted, and user id3 not found. Found only user id2 because he is member of newProject
	t.Run("success, old project was deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			projectRepo.Delete(ctx, oldProject.ProjectID)
			res, err := projectRepo.GetCandidates(ctx, id1, testPermissionCandidates, 0)
			require.NoError(t, err)

			require.Equal(t, 1, len(res))
		})
	})
	// in oldProject role member (users id2, id3) was deleted and found only members (id2) from newProject
	t.Run("success, oldProject member role was deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {

			projectRepo.DeleteRoles(ctx, []int{oldProject.Roles[1].ID})
			res, err := projectRepo.GetCandidates(ctx, id1, testPermissionCandidates, 0)
			require.NoError(t, err)

			require.Equal(t, 1, len(res))
		})
	})
	t.Run("wrong userID", func(t *testing.T) {
		_, err := projectRepo.GetCandidates(t.Context(), 0, testPermissionCandidates, newProject.ProjectID)
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.GetCandidates(getBadContext(t), id1, testPermissionCandidates, newProject.ProjectID)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestGetByID(t *testing.T) {
	cleanDB(t)
	p := testData{}
	p.AddProject(t)

	t.Run("success", func(t *testing.T) {
		project, err := projectRepo.GetByID(t.Context(), p.ProjectID)
		require.NoError(t, err)
		require.Equal(t, project.ID, p.ProjectID)
	})
	t.Run("project not found", func(t *testing.T) {
		_, err := projectRepo.GetByID(t.Context(), 999)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("project deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Delete(ctx, p.ProjectID)
			require.NoError(t, err)
			_, err = projectRepo.GetByID(ctx, p.ProjectID)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})
	t.Run("wrong projectID", func(t *testing.T) {
		_, err := projectRepo.GetByID(t.Context(), 0)
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.GetByID(getBadContext(t), p.ProjectID)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestVerifyMembership(t *testing.T) {
	cleanDB(t)
	userID := mustAddUser(t, testEmail)
	userID1 := mustAddUser(t, testEmail1)
	p := testData{}
	p.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, userID).AddMemberToProject(t, userID1)

	t.Run("success", func(t *testing.T) {
		err := projectRepo.VerifyMembership(t.Context(), p.ProjectID, userID1)
		require.NoError(t, err)
	})
	t.Run("project not found", func(t *testing.T) {
		err := projectRepo.VerifyMembership(t.Context(), 102123, userID1)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("user not found", func(t *testing.T) {
		err := projectRepo.VerifyMembership(t.Context(), p.ProjectID, 110101)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("role deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			// delete member role
			err := projectRepo.DeleteRoles(ctx, []int{p.Roles[1].ID})
			require.NoError(t, err)
			err = projectRepo.VerifyMembership(ctx, p.ProjectID, userID1)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})
	t.Run("user deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := userRepo.Delete(ctx, userID1)
			require.NoError(t, err)
			err = projectRepo.VerifyMembership(ctx, p.ProjectID, userID1)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})
	t.Run("project deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Delete(ctx, p.ProjectID)
			require.NoError(t, err)
			err = projectRepo.VerifyMembership(ctx, p.ProjectID, userID1)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})
	t.Run("wrong projectID", func(t *testing.T) {
		err := projectRepo.VerifyMembership(t.Context(), 0, userID1)
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("wrong userID", func(t *testing.T) {
		err := projectRepo.VerifyMembership(t.Context(), p.ProjectID, 0)
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := projectRepo.VerifyMembership(getBadContext(t), p.ProjectID, userID1)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestCreateRoles(t *testing.T) {
	cleanDB(t)
	p := testData{}
	p.AddProject(t)

	t.Run("success", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			res, err := projectRepo.CreateRoles(ctx, p.ProjectID, []string{testRole})
			require.NoError(t, err)
			require.Equal(t, 1, len(res))
		})

	})
	t.Run("already exists", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			res, err := projectRepo.CreateRoles(ctx, p.ProjectID, []string{testRole})
			require.NoError(t, err)
			require.Equal(t, 1, len(res))
			_, err = projectRepo.CreateRoles(ctx, p.ProjectID, []string{testRole})
			require.ErrorIs(t, err, repo.ErrConflict)
		})
	})

	t.Run("deleted role with same name", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			// create role
			res, err := projectRepo.CreateRoles(ctx, p.ProjectID, []string{testRole})
			require.NoError(t, err)
			require.Equal(t, 1, len(res))
			// delete role
			err = projectRepo.DeleteRoles(ctx, []int{res[0].ID})
			require.NoError(t, err)
			// create same role
			res, err = projectRepo.CreateRoles(ctx, p.ProjectID, []string{testRole})
			require.NoError(t, err)
			require.Equal(t, 1, len(res))
		})
	})

	t.Run("project not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			_, err := projectRepo.CreateRoles(ctx, 1233, []string{testRole})
			require.ErrorIs(t, err, repo.ErrNotFound)

		})
	})
	t.Run("wrong projectID", func(t *testing.T) {
		_, err := projectRepo.CreateRoles(t.Context(), 0, []string{testRole})
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("roles is nil or empty", func(t *testing.T) {
		_, err := projectRepo.CreateRoles(t.Context(), p.ProjectID, nil)
		require.ErrorIs(t, err, repo.ErrValidation)
		_, err = projectRepo.CreateRoles(t.Context(), p.ProjectID, []string{})
		require.ErrorIs(t, err, repo.ErrValidation)
	})

	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.CreateRoles(getBadContext(t), p.ProjectID, []string{testRole})
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestAppendPermissions(t *testing.T) {
	cleanDB(t)
	p := testData{}
	p.AddProject(t).AddRolesToProject(t)
	testPermission := "ttt"
	createPermission(t, testPermission)
	t.Run("success", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.AppendPermissions(ctx, p.Roles[0].ID, []string{testPermission})
			require.NoError(t, err)
		})
	})
	t.Run("role not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.AppendPermissions(ctx, 1111, []string{testPermission})
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})

	t.Run("role deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.DeleteRoles(ctx, []int{p.Roles[0].ID})
			require.NoError(t, err)
			err = projectRepo.AppendPermissions(ctx, p.Roles[0].ID, []string{testPermission})
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})
	t.Run("permission not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.AppendPermissions(ctx, p.Roles[0].ID, []string{"wrongpermission"})
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})

	t.Run("permissions is nil or empty", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.AppendPermissions(ctx, p.Roles[0].ID, nil)
			require.ErrorIs(t, err, repo.ErrValidation)
			err = projectRepo.AppendPermissions(ctx, p.Roles[0].ID, []string{})
			require.ErrorIs(t, err, repo.ErrValidation)
		})
	})
	t.Run("wrong roleID", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.AppendPermissions(ctx, 0, []string{testPermission})
			require.ErrorIs(t, err, repo.ErrValidation)

		})
	})
	t.Run("database internal error", func(t *testing.T) {
		err := projectRepo.AppendPermissions(getBadContext(t), p.Roles[0].ID, []string{testPermission})
		require.ErrorIs(t, err, repo.ErrInternal)
	})

}

func TestGetProjectRoles(t *testing.T) {
	cleanDB(t)
	p := testData{}
	p.AddProject(t).AddRolesToProject(t)

	t.Run("success", func(t *testing.T) {
		res, err := projectRepo.GetProjectRoles(t.Context(), p.ProjectID)
		require.NoError(t, err)
		require.Len(t, res, 2)
	})

	t.Run("success, one role deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			projectRepo.DeleteRoles(ctx, []int{p.Roles[1].ID})
			res, err := projectRepo.GetProjectRoles(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Len(t, res, 1)
		})
	})

	t.Run("project not found", func(t *testing.T) {
		res, err := projectRepo.GetProjectRoles(t.Context(), 111)
		require.NoError(t, err)
		require.Len(t, res, 0)
	})
	t.Run("project deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			projectRepo.Delete(ctx, p.ProjectID)
			res, err := projectRepo.GetProjectRoles(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Len(t, res, 0)
		})
	})
	t.Run("wrong projectID", func(t *testing.T) {
		_, err := projectRepo.GetProjectRoles(t.Context(), 0)
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.GetProjectRoles(getBadContext(t), p.ProjectID)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestHasPermission(t *testing.T) {

	cleanDB(t)
	p := testData{}
	userID := mustAddUser(t, testEmail)
	userID2 := mustAddUser(t, testEmail1)
	p.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, userID).AddMemberToProject(t, userID2)

	t.Run("success", func(t *testing.T) {
		res, err := projectRepo.HasPermission(t.Context(), p.ProjectID, userID, testPermissionCandidates)
		require.NoError(t, err)
		require.Equal(t, true, res)
	})

	t.Run("dont have permission", func(t *testing.T) {
		res, err := projectRepo.HasPermission(t.Context(), p.ProjectID, userID2, testPermissionCandidates)
		require.NoError(t, err)
		require.Equal(t, false, res)
	})

	t.Run("permission dont exists", func(t *testing.T) {
		res, err := projectRepo.HasPermission(t.Context(), p.ProjectID, userID, "wrongpermission")
		require.NoError(t, err)
		require.Equal(t, false, res)
	})

	t.Run("role deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			projectRepo.DeleteRoles(ctx, []int{p.Roles[0].ID})
			res, err := projectRepo.HasPermission(ctx, p.ProjectID, userID, testPermissionCandidates)
			require.NoError(t, err)
			require.Equal(t, false, res)
		})
	})
	t.Run("project deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			projectRepo.Delete(ctx, p.ProjectID)
			res, err := projectRepo.HasPermission(ctx, p.ProjectID, userID, testPermissionCandidates)
			require.NoError(t, err)
			require.Equal(t, false, res)
		})
	})

	t.Run("user deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			userRepo.Delete(ctx, p.OwnerID)
			res, err := projectRepo.HasPermission(ctx, p.ProjectID, userID, testPermissionCandidates)
			require.NoError(t, err)
			require.Equal(t, false, res)
		})
	})
	t.Run("wrong IDs", func(t *testing.T) {
		_, err := projectRepo.HasPermission(t.Context(), 0, userID, testPermissionCandidates)
		require.ErrorIs(t, err, repo.ErrValidation)
		_, err = projectRepo.HasPermission(t.Context(), p.ProjectID, 0, testPermissionCandidates)
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.HasPermission(getBadContext(t), p.ProjectID, userID, testPermissionCandidates)
		require.ErrorIs(t, err, repo.ErrInternal)
	})

}

func TestGetMemberRights(t *testing.T) {
	cleanDB(t)
	p := testData{}
	userID := mustAddUser(t, testEmail)
	p.AddProject(t).AddRolesToProject(t).AddOwnerToProject(t, userID).AddMemberToProject(t, userID)
	testPermission := "t2"
	createPermission(t, testPermission)
	err := projectRepo.AppendPermissions(t.Context(), p.Roles[0].ID, []string{testPermission})
	require.NoError(t, err)
	err = projectRepo.AppendPermissions(t.Context(), p.Roles[1].ID, []string{testPermission})
	require.NoError(t, err)

	t.Run("success", func(t *testing.T) {
		res, err := projectRepo.GetMemberRights(t.Context(), p.ProjectID, userID)
		require.NoError(t, err)
		require.Len(t, res, 2)
		require.Contains(t, res, testPermission)

	})

	t.Run("project not found", func(t *testing.T) {
		res, err := projectRepo.GetMemberRights(t.Context(), 12312, userID)
		require.NoError(t, err)
		require.Len(t, res, 0)
	})
	t.Run("project deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Delete(ctx, p.ProjectID)
			require.NoError(t, err)
			res, err := projectRepo.GetMemberRights(ctx, p.ProjectID, userID)
			require.NoError(t, err)
			require.Len(t, res, 0)
		})
	})

	t.Run("user not found", func(t *testing.T) {
		res, err := projectRepo.GetMemberRights(t.Context(), p.ProjectID, 21321)
		require.NoError(t, err)
		require.Len(t, res, 0)
	})

	t.Run("user deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := userRepo.Delete(ctx, userID)
			require.NoError(t, err)
			res, err := projectRepo.GetMemberRights(ctx, p.ProjectID, userID)
			require.NoError(t, err)
			require.Len(t, res, 0)
		})
	})

	t.Run("role deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.DeleteRoles(ctx, []int{p.Roles[0].ID})
			require.NoError(t, err)
			res, err := projectRepo.GetMemberRights(ctx, p.ProjectID, userID)
			require.NoError(t, err)
			require.Len(t, res, 1)
		})
	})

	t.Run("wrong IDs", func(t *testing.T) {
		_, err := projectRepo.GetMemberRights(t.Context(), 0, userID)
		require.ErrorIs(t, err, repo.ErrValidation)
		_, err = projectRepo.GetMemberRights(t.Context(), p.ProjectID, 0)
		require.ErrorIs(t, err, repo.ErrValidation)
	})

	t.Run("database internal error", func(t *testing.T) {
		_, err := projectRepo.GetMemberRights(getBadContext(t), p.ProjectID, userID)
		require.ErrorIs(t, err, repo.ErrInternal)
	})

}

func TestUpdate(t *testing.T) {
	cleanDB(t)
	p := testData{}
	p.AddProject(t)
	newName := "NewName"
	newDesc := "NewDesc"
	t.Run("success", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			// only name

			err := projectRepo.Update(ctx, p.ProjectID, &dto.ProjectUpdate{
				Name:        newName,
				Description: newDesc,
			})
			require.NoError(t, err)
			res, err := projectRepo.GetByID(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Equal(t, newName, res.Name)
			require.Equal(t, newDesc, res.Description)
		})
	})

	t.Run("success, only name", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			// only name
			err := projectRepo.Update(ctx, p.ProjectID, &dto.ProjectUpdate{
				Name: newName,
			})
			require.NoError(t, err)
			res, err := projectRepo.GetByID(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Equal(t, newName, res.Name)
			require.Equal(t, p.Description, res.Description)
		})
	})

	t.Run("success, only description", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			// only name
			err := projectRepo.Update(ctx, p.ProjectID, &dto.ProjectUpdate{
				Description: newDesc,
			})
			require.NoError(t, err)
			res, err := projectRepo.GetByID(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Equal(t, newDesc, res.Description)
			require.Equal(t, p.Name, res.Name)
		})
	})

	t.Run("project not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Update(ctx, 1231, &dto.ProjectUpdate{
				Name: newName,
			})
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})

	t.Run("project deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Delete(ctx, p.ProjectID)
			require.NoError(t, err)
			err = projectRepo.Update(ctx, p.ProjectID, &dto.ProjectUpdate{
				Name: newName,
			})
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})

	t.Run("data is nil", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {

			err := projectRepo.Update(ctx, p.ProjectID, nil)
			require.ErrorIs(t, err, repo.ErrValidation)

		})
	})

	t.Run("data is empty", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Update(ctx, p.ProjectID, &dto.ProjectUpdate{})
			require.NoError(t, err)
			res, err := projectRepo.GetByID(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Equal(t, p.Description, res.Description)
			require.Equal(t, p.Name, res.Name)
		})
	})

	t.Run("wrong projectID", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			err := projectRepo.Update(ctx, 0, &dto.ProjectUpdate{
				Name: newName,
			})
			require.ErrorIs(t, err, repo.ErrValidation)
		})
	})
	t.Run("database internal error", func(t *testing.T) {
		err := projectRepo.Update(getBadContext(t), p.ProjectID, &dto.ProjectUpdate{
			Name: newName,
		})
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestDelete(t *testing.T) {
	cleanDB(t)
	p := testData{}
	p.AddProject(t)

	t.Run("success", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			res, err := projectRepo.GetByID(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Equal(t, 1, res.ID)
			err = projectRepo.Delete(ctx, p.ProjectID)
			require.NoError(t, err)
			_, err = projectRepo.GetByID(ctx, p.ProjectID)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})
	t.Run("not found", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			_, err := projectRepo.GetByID(ctx, 11111)
			require.ErrorIs(t, err, repo.ErrNotFound)
			err = projectRepo.Delete(ctx, 11111)
			require.ErrorIs(t, err, repo.ErrNotFound)

		})
	})

	t.Run("already deleted", func(t *testing.T) {
		inTx(t, func(ctx context.Context) {
			// check project exist
			res, err := projectRepo.GetByID(ctx, p.ProjectID)
			require.NoError(t, err)
			require.Equal(t, 1, res.ID)
			// delete project
			err = projectRepo.Delete(ctx, p.ProjectID)
			require.NoError(t, err)
			// check project is deleted
			_, err = projectRepo.GetByID(ctx, p.ProjectID)
			require.ErrorIs(t, err, repo.ErrNotFound)
			// delete project again
			err = projectRepo.Delete(ctx, p.ProjectID)
			require.ErrorIs(t, err, repo.ErrNotFound)
		})
	})

	t.Run("wrong projectID", func(t *testing.T) {
		err := projectRepo.Delete(t.Context(), 0)
		require.ErrorIs(t, err, repo.ErrValidation)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := projectRepo.Delete(getBadContext(t), p.ProjectID)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestDeleteRoles(t *testing.T) {

}
