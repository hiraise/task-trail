package entity_test

import (
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
)

// An administrator is granted and removed, but the last one cannot be removed (ADR-0014).
func TestSetAdmin(t *testing.T) {
	created := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)
	now := created.Add(time.Hour)
	cases := []struct {
		name      string
		was, set  bool
		admins    int
		isAdmin   bool // flag after
		changed   bool // UpdatedAt moved
		lastAdmin bool // LAST_ADMIN error
	}{
		{name: "grant", was: false, set: true, admins: 1, isAdmin: true, changed: true},
		{name: "remove one of two", was: true, set: false, admins: 2, isAdmin: false, changed: true},
		{name: "remove the last one", was: true, set: false, admins: 1, isAdmin: true, lastAdmin: true},
		{name: "already an administrator", was: true, set: true, admins: 1, isAdmin: true},
		{name: "already not an administrator", was: false, set: false, admins: 1, isAdmin: false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			u := &entity.UserAccount{ID: "u", IsAdmin: c.was, UpdatedAt: created}
			err := u.SetAdmin(c.set, c.admins, now)
			if c.lastAdmin != domain.HasCode(err, domain.LastAdmin) || (!c.lastAdmin && err != nil) {
				t.Fatalf("error %v", err)
			}
			if u.IsAdmin != c.isAdmin || u.UpdatedAt.Equal(now) != c.changed {
				t.Fatalf("after: %+v", u)
			}
		})
	}
}
