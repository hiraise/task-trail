package entity_test

import (
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
)

func member(role entity.ProjectRole) *entity.ProjectMember {
	return &entity.ProjectMember{ProjectID: "p", UserID: entity.UserID(role), Role: role}
}

var roles = []entity.ProjectRole{entity.RoleOwner, entity.RoleAdmin, entity.RoleMember}

func allowed(t *testing.T, err error) bool {
	t.Helper()
	if err != nil && !domain.HasCode(err, domain.Forbidden) {
		t.Fatalf("error %v", err)
	}
	return err == nil
}

// Permissions by role (ADR-0003, contract): the owner and administrators change the project and invite people,
// only the owner deletes the project and changes roles.
func TestRequireRole(t *testing.T) {
	for role, want := range map[entity.ProjectRole][2]bool{
		entity.RoleOwner:  {true, true},
		entity.RoleAdmin:  {true, false},
		entity.RoleMember: {false, false},
	} {
		m := member(role)
		if got := [2]bool{allowed(t, m.RequireManager()), allowed(t, m.RequireOwner())}; got != want {
			t.Errorf("%s: change project and invite, owner — %v, want %v", role, got, want)
		}
	}
}

// The owner removes anyone except themselves; an administrator — only members.
func TestCheckRemove(t *testing.T) {
	want := map[[2]entity.ProjectRole]bool{
		{entity.RoleOwner, entity.RoleAdmin}:  true,
		{entity.RoleOwner, entity.RoleMember}: true,
		{entity.RoleAdmin, entity.RoleMember}: true,
	}
	for _, who := range roles {
		for _, whom := range roles {
			if got := allowed(t, member(who).CheckRemove(member(whom))); got != want[[2]entity.ProjectRole{who, whom}] {
				t.Errorf("%s removes %s: %v", who, whom, got)
			}
		}
	}
}

// The owner changes roles; the owner role is neither handed over nor taken away.
func TestChangeRoleOf(t *testing.T) {
	now := time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)
	target := member(entity.RoleMember)
	if err := member(entity.RoleOwner).ChangeRoleOf(target, entity.RoleAdmin, now); err != nil || target.Role != entity.RoleAdmin || !target.UpdatedAt.Equal(now) {
		t.Fatalf("making an administrator: %+v, %v", target, err)
	}
	cases := []struct {
		who, whom, role entity.ProjectRole
	}{
		{entity.RoleAdmin, entity.RoleMember, entity.RoleAdmin},
		{entity.RoleMember, entity.RoleMember, entity.RoleAdmin},
		{entity.RoleOwner, entity.RoleOwner, entity.RoleAdmin},
		{entity.RoleOwner, entity.RoleMember, entity.RoleOwner},
	}
	for _, c := range cases {
		target := member(c.whom)
		if allowed(t, member(c.who).ChangeRoleOf(target, c.role, now)) || target.Role != c.whom {
			t.Errorf("%s changes role of %s to %s: allowed", c.who, c.whom, c.role)
		}
	}
}

func TestCheckLeave(t *testing.T) {
	if err := member(entity.RoleOwner).CheckLeave(); !domain.HasCode(err, domain.OwnerCannotLeave) {
		t.Errorf("owner: %v", err)
	}
	for _, role := range []entity.ProjectRole{entity.RoleAdmin, entity.RoleMember} {
		if err := member(role).CheckLeave(); err != nil {
			t.Errorf("%s: %v", role, err)
		}
	}
}
