//go:build integration

package persistent

import (
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"testing"

	"github.com/stretchr/testify/require"
)

var tProject dto.ProjectCreate = dto.ProjectCreate{
	Name:        "TestProject",
	Description: "TestProject",
	OwnerID:     1,
}

func mustAddProject(t *testing.T, ownerID int) int {
	p := dto.ProjectCreate{
		Name:        "TestProject",
		Description: "TestProject",
		OwnerID:     ownerID,
	}
	id, err := projectRepo.Create(t.Context(), &p)
	require.NoError(t, err)
	return id
}
func mustAddMembers(t *testing.T, projectID int, memberIDs []int) {
	dto := dto.ProjectAddMembersDB{
		ProjectID: projectID,
		MemberIDs: memberIDs,
	}
	err := projectRepo.AddMembers(t.Context(), &dto)
	require.NoError(t, err)
}

func initProject(t *testing.T) {
	ownerID := mustAddUser(t, "test@mail.com")
	mustAddProject(t, ownerID)
}

func TestProjectCreate(t *testing.T) {
	cleanDB(t)
	t.Run("success", func(t *testing.T) {
		initProject(t)
	})
	t.Run("owner not found", func(t *testing.T) {
		dto := tProject
		dto.OwnerID = 2
		id, err := projectRepo.Create(t.Context(), &dto)
		require.ErrorIs(t, err, repo.ErrNotFound)
		require.Equal(t, 0, id)
	})
	t.Run("database internal error", func(t *testing.T) {
		id, err := projectRepo.Create(getBadContext(t), &tProject)
		require.ErrorIs(t, err, repo.ErrInternal)
		require.Equal(t, 0, id)
	})
}

func TestProjectAddMembers(t *testing.T) {
	cleanDB(t)
	initProject(t)
	id1 := mustAddUser(t, testEmail1)
	id2 := mustAddUser(t, testEmail2)
	dto := dto.ProjectAddMembersDB{
		ProjectID: 1,
		MemberIDs: []int{
			id1, id2,
		},
	}
	t.Run("success", func(t *testing.T) {
		err := projectRepo.AddMembers(t.Context(), &dto)
		require.NoError(t, err)
		require.NoError(t, projectRepo.IsMember(t.Context(), 1, id1))
	})
	t.Run("project not found", func(t *testing.T) {
		dd := dto
		dd.ProjectID = 2
		err := projectRepo.AddMembers(t.Context(), &dd)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("member not found", func(t *testing.T) {
		dd := dto
		dd.MemberIDs = []int{99}
		err := projectRepo.AddMembers(t.Context(), &dd)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := projectRepo.AddMembers(getBadContext(t), &dto)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestProjectGetList(t *testing.T) {
	cleanDB(t)
	initProject(t)
	uID := mustAddUser(t, testEmail1)
	pID := mustAddProject(t, uID)
	_ = mustAddProject(t, uID) // third project, but user ID 1 is not a member
	mustAddMembers(t, pID, []int{1})
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
