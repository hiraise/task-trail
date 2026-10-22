package entity_test

import (
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
)

// Администратора назначают и снимают, но последнего снять нельзя (ADR-0014).
func TestSetAdmin(t *testing.T) {
	created := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)
	now := created.Add(time.Hour)
	cases := []struct {
		name      string
		was, set  bool
		admins    int
		isAdmin   bool // признак после
		changed   bool // UpdatedAt сдвинут
		lastAdmin bool // ошибка LAST_ADMIN
	}{
		{name: "назначить", was: false, set: true, admins: 1, isAdmin: true, changed: true},
		{name: "снять одного из двух", was: true, set: false, admins: 2, isAdmin: false, changed: true},
		{name: "снять последнего", was: true, set: false, admins: 1, isAdmin: true, lastAdmin: true},
		{name: "уже администратор", was: true, set: true, admins: 1, isAdmin: true},
		{name: "уже не администратор", was: false, set: false, admins: 1, isAdmin: false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			u := &entity.UserAccount{ID: "u", IsAdmin: c.was, UpdatedAt: created}
			err := u.SetAdmin(c.set, c.admins, now)
			if c.lastAdmin != domain.HasCode(err, domain.LastAdmin) || (!c.lastAdmin && err != nil) {
				t.Fatalf("ошибка %v", err)
			}
			if u.IsAdmin != c.isAdmin || u.UpdatedAt.Equal(now) != c.changed {
				t.Fatalf("после: %+v", u)
			}
		})
	}
}
