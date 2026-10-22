import type { ProjectRole } from "@/domain/types";

import {
  canChangeRoles,
  canDeleteProject,
  canEditProject,
  canInviteMembers,
  canLeaveProject,
  canRemoveMember,
} from "./userRole";

const roles: ProjectRole[] = ["owner", "admin", "member"];
const allowed = (check: (role: ProjectRole) => boolean) => roles.filter(check);

describe("права по роли в проекте", () => {
  it("проект меняют и зовут людей владелец и администратор", () => {
    expect(allowed(canEditProject)).toEqual(["owner", "admin"]);
    expect(allowed(canInviteMembers)).toEqual(["owner", "admin"]);
  });

  it("удаляет проект и меняет роли только владелец, выйти может любой, кроме него", () => {
    expect(allowed(canDeleteProject)).toEqual(["owner"]);
    expect(allowed(canChangeRoles)).toEqual(["owner"]);
    expect(allowed(canLeaveProject)).toEqual(["admin", "member"]);
  });

  it("владелец исключает любого, кроме владельца; администратор — только участников", () => {
    expect(allowed((target) => canRemoveMember("owner", target))).toEqual(["admin", "member"]);
    expect(allowed((target) => canRemoveMember("admin", target))).toEqual(["member"]);
    expect(allowed((target) => canRemoveMember("member", target))).toEqual([]);
  });
});
