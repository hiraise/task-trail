import { AnimatePresence, motion as m } from "framer-motion";
import { useState } from "react";

import {
  isProjectMemberAdmin,
  isProjectMemberOwner,
  type ProjectMember,
} from "@/domain/models/ProjectMember";
import { IconButton, MembersAvatarList } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import { MemberCard } from "./MemberCard";
import { MemberTag } from "./MemberTag";
import styles from "./ProjectMembers.module.css";

export function ProjectMembers({ members }: { members: ProjectMember[] }) {
  const memberIds = members.map((member) => member.id) || [];
  const [isExpanded, setIsExpanded] = useState(false);

  const toogleExpanded = () => setIsExpanded((prev) => !prev);

  return (
    <div className={styles.container}>
      <div className={styles.titleWrapper}>
        <h4>{TEXTS.projects.members}</h4>
        <m.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <IconButton icon={ICONS.rightArrow} size="24px" onClick={toogleExpanded} />
        </m.div>
      </div>
      <AnimatePresence mode="wait">
        {!isExpanded && <MembersAvatarList memberIds={memberIds} variant="large" />}
        {isExpanded && (
          <m.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 48, opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: "easeInOut",
              opacity: { delay: 0.1, duration: 0.3 },
            }}
            style={{ overflow: "hidden" }}
          >
            <MembersDetailView members={members} />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MembersDetailView({ members }: { members: ProjectMember[] }) {
  const admins = members.filter((m) => isProjectMemberAdmin(m) || isProjectMemberOwner(m));
  const displayMembers = members.filter(
    (m) => !isProjectMemberAdmin(m) && !isProjectMemberOwner(m),
  );

  return (
    <div className={styles.membersWrapper}>
      {admins.length > 0 && (
        <div className={styles.content}>
          <MemberTag tag="admin" />
          <div className={styles.members}>
            {admins.map((user) => (
              <MemberCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}
      {displayMembers.length > 0 && (
        <div className={styles.content}>
          <MemberTag tag="member" />
          <div className={styles.members}>
            {displayMembers.map((user) => (
              <MemberCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
