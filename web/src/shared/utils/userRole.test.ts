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

describe("permissions by project role", () => {
  it("the owner and admin edit the project and invite people", () => {
    expect(allowed(canEditProject)).toEqual(["owner", "admin"]);
    expect(allowed(canInviteMembers)).toEqual(["owner", "admin"]);
  });

  it("only the owner deletes the project and changes roles; anyone but the owner can leave", () => {
    expect(allowed(canDeleteProject)).toEqual(["owner"]);
    expect(allowed(canChangeRoles)).toEqual(["owner"]);
    expect(allowed(canLeaveProject)).toEqual(["admin", "member"]);
  });

  it("the owner removes anyone but the owner; an admin removes only members", () => {
    expect(allowed((target) => canRemoveMember("owner", target))).toEqual(["admin", "member"]);
    expect(allowed((target) => canRemoveMember("admin", target))).toEqual(["member"]);
    expect(allowed((target) => canRemoveMember("member", target))).toEqual([]);
  });
});
