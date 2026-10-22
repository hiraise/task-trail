import { clsx } from "clsx";

import type { ProjectId } from "@/domain/types";
import { Spinner, UserItem } from "@/presentation/shared";
import { emailField } from "@/presentation/shared/forms/fields";
import { projectsTexts } from "@/shared/locales/projects";

import { useGetProjectCandidates } from "../../hooks";

import { UserItemCheckBox } from "./UserItemCheckbox";
import styles from "./UsersList.module.css";

interface UsersListProps {
  /** The project people are invited to: its members are not listed. Without it — a new project */
  projectId?: ProjectId;
  onUserSelect: (email: string) => void;
  selectedUsers?: string[];
  searchQuery?: string;
}

/**
 * Whom to invite: people from shared projects (listProjectCandidates), search by name and email.
 * No one found but an email is typed — it can be selected: an unknown email gets an invitation.
 */
export function UsersList({
  projectId,
  onUserSelect,
  selectedUsers = [],
  searchQuery = "",
}: UsersListProps) {
  const { data: candidates = [], isLoading } = useGetProjectCandidates(projectId);
  const query = searchQuery.trim().toLowerCase();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Spinner size={30} />
      </div>
    );
  }

  const found = query
    ? candidates.filter(
        (user) =>
          user.email.includes(query) || user.username?.toLowerCase().includes(query),
      )
    : candidates;

  if (found.length > 0) {
    return (
      <div className={styles.container}>
        {found.map((user) => (
          <UserItemCheckBox
            key={user.id}
            user={user}
            isSelected={selectedUsers.includes(user.email)}
            onSelect={onUserSelect}
          />
        ))}
      </div>
    );
  }

  if (emailField.safeParse(query).success) {
    return (
      <button
        type="button"
        className={clsx(styles.container, styles.selectUser)}
        onClick={() => onUserSelect(query)}
      >
        <UserItem email={query} />
      </button>
    );
  }

  return (
    <div className={clsx(styles.container, styles.emptyState)}>
      {query ? projectsTexts.userNotFound : projectsTexts.noCandidates}
    </div>
  );
}
