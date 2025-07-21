package project

import (
	"context"
	"errors"
	"maps"
	"slices"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

var defaultRoles = map[string]dto.ProjectRoleCreate{
	AdminRoleName: {
		Name:        AdminRoleName,
		Permissions: []string{PROJECT_INVITE_USERS, PROJECT_KICK_USERS, PROJECT_EDIT},
	},
	OwnerRoleName: {
		Name:        OwnerRoleName,
		Permissions: []string{PROJECT_INVITE_USERS, PROJECT_KICK_USERS, PROJECT_SET_ROLES, PROJECT_EDIT, PROJECT_ARCHIVE, PROJECT_DELETE},
	},
	MemberRoleName: {
		Name:        MemberRoleName,
		Permissions: []string{},
	},
}

var defRolesSlice = slices.Collect(maps.Values(defaultRoles))

func (u *UseCase) Create(ctx context.Context, data *dto.ProjectCreate) (int, error) {
	var id int
	var err error
	f := func(ctx context.Context) error {
		id, err = u.projectRepo.Create(ctx, data)
		if err != nil {
			if errors.Is(err, repo.ErrNotFound) {
				return u.errHandler.NotFound(err, "owner not found", "ownerID", data.OwnerID)
			}
			return u.errHandler.InternalTrouble(err, "failed to create project", "ownerID", data.OwnerID)
		}

		createdRoles, err := u.projectRepo.CreateRoles(ctx, id, defRolesSlice)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "failed to create default default project roles")
		}

		for _, role := range createdRoles {
			if dRole, ok := defaultRoles[role.Name]; ok && len(dRole.Permissions) > 0 {
				if err := u.projectRepo.AppendPermissions(ctx, role.ID, dRole.Permissions); err != nil {
					return u.errHandler.InternalTrouble(
						err,
						"failed to append permissions to role",
						"permissions", dRole.Permissions,
					)
				}
			}

		}

		role, err := u.findRolesInList(createdRoles, OwnerRoleName)
		if err != nil {
			return err
		}
		// set owner
		if err := u.projectRepo.AddMembers(ctx,
			[]*dto.ProjectAddMembersDB{{MemberID: data.OwnerID, ProjectID: id, RoleID: role.ID}}); err != nil {
			return u.errHandler.InternalTrouble(
				err,
				"failed to add owner to project",
				"ownerID", data.OwnerID,
			)
		}
		return nil
	}
	if err := u.txManager.DoWithTx(ctx, f); err != nil {
		return 0, err
	}
	return id, nil
}

func (u *UseCase) findRolesInList(roles []*dto.ProjectRoleRes, name string) (*dto.ProjectRoleRes, error) {
	for _, role := range roles {
		if role.Name == name {
			return role, nil
		}
	}
	return nil, u.errHandler.InternalTrouble(
		nil,
		"failed to find role in list",
		"roleName", name,
	)
}
