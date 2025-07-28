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

// func mustAddProject(t *testing.T, ownerID int) int {
// 	p := dto.ProjectCreate{
// 		Name:        "TestProject",
// 		Description: "TestProject",
// 		OwnerID:     ownerID,
// 	}
// 	id, err := projectRepo.Create(t.Context(), &p)
// 	require.NoError(t, err)
// 	return id
// }

// func mustAddMembers(t *testing.T, projectID int, memberIDs []int) {
// 	dto := dto.ProjectAddMembersDB{
// 		ProjectID: projectID,
// 		MemberIDs: memberIDs,
// 	}
// 	err := projectRepo.AddMembers(t.Context(), &dto)
// 	require.NoError(t, err)
// }

const testRole = "t1"
const testRole1 = "t2"

type testData struct {
	OwnerID   int
	ProjectID int
	Roles     []*dto.ProjectRoleRes
}

func (d *testData) AddOwner(t *testing.T, email string) *testData {
	d.OwnerID = mustAddUser(t, email)
	return d
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
	d.Roles = roles
	return d
}

func (d *testData) AddOwnerToProject(t *testing.T) *testData {
	err := projectRepo.AddMembers(t.Context(), []*dto.ProjectAddMembersDB{
		{
			ProjectID: d.ProjectID,
			MemberID:  d.OwnerID,
			RoleID:    d.Roles[0].ID,
		},
	})
	require.NoError(t, err)
	return d
}

func (d *testData) AddMemberToProject(t *testing.T, memberID int) *testData {
	err := projectRepo.AddMembers(t.Context(), []*dto.ProjectAddMembersDB{
		{
			ProjectID: d.ProjectID,
			MemberID:  memberID,
			RoleID:    d.Roles[1].ID,
		},
	})
	require.NoError(t, err)
	return d
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

func TestProjectAddMembers(t *testing.T) {
	cleanDB(t)
	td := testData{}
	td.AddProject(t).AddRolesToProject(t)
	id1 := mustAddUser(t, testEmail1)
	id2 := mustAddUser(t, testEmail2)
	dto := []*dto.ProjectAddMembersDB{
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
		err := txManager.DoWithTx(t.Context(), func(ctx context.Context) error {
			err := projectRepo.AddMembers(ctx, dto)
			require.NoError(t, err)
			require.NoError(t, projectRepo.IsMember(ctx, 1, id1))
			require.NoError(t, projectRepo.IsMember(ctx, 1, id2))
			return fmt.Errorf("rollback")
		})
		require.EqualError(t, err, "rollback")

	})
	t.Run("project not found", func(t *testing.T) {
		dd := dto
		dd[0].ProjectID = 2
		err := projectRepo.AddMembers(t.Context(), dd)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("member not found", func(t *testing.T) {
		dd := dto
		dd[0].MemberID = 99
		err := projectRepo.AddMembers(t.Context(), dd)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("role not found", func(t *testing.T) {
		dd := dto
		dd[0].RoleID = 99
		err := projectRepo.AddMembers(t.Context(), dd)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := projectRepo.AddMembers(getBadContext(t), dto)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestProjectGetList(t *testing.T) {
	cleanDB(t)
	td1 := testData{}
	td1.AddProject(t).AddOwner(t, testEmail).AddRolesToProject(t).AddOwnerToProject(t)
	td2 := testData{}
	td2.AddProject(t).AddOwner(t, testEmail1).AddRolesToProject(t).AddOwnerToProject(t)
	td2.AddMemberToProject(t, td1.OwnerID)
	dto := dto.ProjectList{
		MemberID: 1,
	}
	t.Run("success", func(t *testing.T) {
		projects, err := projectRepo.GetList(t.Context(), &dto)
		require.NoError(t, err)
		require.Equal(t, len(projects), 2)
	})
	t.Run("success, but empty", func(t *testing.T) {
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

// func TestProjectGetOwned(t *testing.T) {
// 	cleanDB(t)
// 	td1 := testData{}
// 	memberID := mustAddUser(t, testEmail1) // id = 1
// 	td1.AddProject(t).
// 		AddRolesToProject(t).
// 		AddOwner(t, testEmail). // id = 2
// 		AddOwnerToProject(t).
// 		AddMemberToProject(t, memberID)
// 	t.Run("success", func(t *testing.T) {
// 		project, err := projectRepo.GetOwned(t.Context(), td1.ProjectID, td1.OwnerID, testRole)
// 		require.NoError(t, err)
// 		require.Equal(t, 2, len(project.Members))
// 		require.Equal(t,
// 			[]*dto.UserEmailAndID{
// 				{ID: 1, Email: testEmail1},
// 				{ID: 2, Email: testEmail},
// 			},
// 			project.Members,
// 		)
// 	})
// }
