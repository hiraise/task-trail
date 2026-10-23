import clsx from "clsx";

import type { Board } from "@/domain/models/Board";
import { getUserDisplayName, type User } from "@/domain/models/User";
import { IconButton, Icon, SubmitButton, UserAvatar } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { boardsTexts } from "@/shared/locales/boards";

import { useAddBoardMembers, useRemoveBoardMember } from "../../hooks";

import styles from "./BoardMemberGroups.module.css";

interface BoardMemberGroupsProps {
  board: Board;
  isOwner: boolean;
}

/**
 * Board members in two groups: the owner and the others. No "Invited users": boards have no email
 * invitations (ADR-0029). The owner removes members and adds people from their projects.
 */
export function BoardMemberGroups({ board, isOwner }: BoardMemberGroupsProps) {
  const { showSelectBoardMembers, showDeleteItem } = useGlobalModals();
  const { mutate: addMembers } = useAddBoardMembers();
  const { mutate: removeMember } = useRemoveBoardMember();
  const owner = board.members.filter((member) => member.id === board.ownerId);
  const others = board.members.filter((member) => member.id !== board.ownerId);

  const handleAdd = async () => {
    const selected = await showSelectBoardMembers({
      selectedIds: [],
      excludeIds: board.members.map((member) => member.id),
      applyText: boardsTexts.add,
    });

    if (selected && selected.length > 0) {
      addMembers({ boardId: board.id, userIds: selected.map((user) => user.id) });
    }
  };

  const handleRemove = async (member: User) => {
    const confirmed = await showDeleteItem({
      type: "member",
      id: member.id,
      title: getUserDisplayName(member),
    });

    if (confirmed) removeMember({ boardId: board.id, userId: member.id });
  };

  return (
    <div className={styles.groups}>
      <section className={styles.group}>
        <span className={clsx("caption-med", styles.tag, styles.ownerTag)}>{boardsTexts.owner}</span>
        <div className={styles.members}>
          {owner.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      </section>
      <section className={styles.group}>
        <span className={clsx("caption-med", styles.tag, styles.memberTag)}>
          {boardsTexts.regularMembers}
        </span>
        {others.length > 0 ? (
          <div className={styles.members}>
            {others.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onRemove={isOwner ? () => handleRemove(member) : undefined}
              />
            ))}
          </div>
        ) : (
          <p className={clsx("body-reg-2", styles.empty)}>{boardsTexts.noMembers}</p>
        )}
        {isOwner && (
          <SubmitButton type="button" variant="text" className={styles.add} onClick={handleAdd}>
            <Icon as={ICONS.plus} size="24px" />
            <span className="btn-font-s">{boardsTexts.addMembers}</span>
          </SubmitButton>
        )}
      </section>
    </div>
  );
}

function MemberRow({ member, onRemove }: { member: User; onRemove?: () => void }) {
  const name = getUserDisplayName(member);

  return (
    <div className={styles.row}>
      <div className={styles.user}>
        <UserAvatar variant="large" src={member.avatarUrl} name={name} />
        <div className={styles.text}>
          <span className="body-med">{name}</span>
          <span className={clsx("body-reg-2", styles.email)}>{member.email}</span>
        </div>
      </div>
      {onRemove && (
        <IconButton
          icon={ICONS.delete}
          size="24px"
          aria-label={boardsTexts.removeMember}
          onClick={onRemove}
        />
      )}
    </div>
  );
}
