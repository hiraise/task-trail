import clsx from "clsx";

import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/types";
import { TEXTS } from "@/shared/locales/texts";
import { isProjectAdmin } from "@/shared/utils/userRole";

import styles from "./MemberGroups.module.css";
import { MemberRow } from "./MemberRow";
import { MemberTag } from "./MemberTag";

interface MemberGroupsProps {
  members: ProjectMember[];
  projectId: ProjectId;
}

/** Members grouped as in the mockup: admins (owner first) and members. */
export function MemberGroups({ members, projectId }: MemberGroupsProps) {
  const admins = members
    .filter((member) => isProjectAdmin(member.role))
    .sort((a, b) => Number(b.role === "owner") - Number(a.role === "owner"));
  const regular = members.filter((member) => !isProjectAdmin(member.role));

  return (
    <div className={styles.groups}>
      <section className={styles.group}>
        <MemberTag tag="admin" />
        <div className={styles.members}>
          {admins.map((member) => (
            <MemberRow key={member.id} member={member} projectId={projectId} />
          ))}
        </div>
      </section>
      <section className={styles.group}>
        <MemberTag tag="member" />
        {regular.length > 0 ? (
          <div className={styles.members}>
            {regular.map((member) => (
              <MemberRow key={member.id} member={member} projectId={projectId} />
            ))}
          </div>
        ) : (
          <p className={clsx("body-reg-2", styles.empty)}>{TEXTS.projects.noMembers}</p>
        )}
      </section>
    </div>
  );
}
