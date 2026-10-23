import clsx from "clsx";
import { Link } from "@tanstack/react-router";

import type { Board } from "@/domain/models/Board";
import { getUserDisplayName } from "@/domain/models/User";
import { DropdownMenu, Icon, IconButton } from "@/presentation/shared";
import type { MenuItem } from "@/presentation/shared/ui/DropdownMenu";
import { ICONS } from "@/shared/config/icons";
import { boardsTexts } from "@/shared/locales/boards";
import { formatDate } from "@/shared/utils/formatters";

import styles from "./BoardHeader.module.css";

interface BoardHeaderProps {
  board: Board;
  /** The "…" menu wider than a phone; on a phone the menu is in the page top bar */
  menuItems: MenuItem[];
  /** On the board page — a link to the board info */
  showInfoLink?: boolean;
}

/** Board name, then "owner | creation date" (frames 843:91329, 1772:145700). */
export function BoardHeader({ board, menuItems, showInfoLink = false }: BoardHeaderProps) {
  const owner = board.members.find((member) => member.id === board.ownerId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.name}>{board.name}</h2>
        {menuItems.length > 0 && (
          <div className={styles.menu}>
            <DropdownMenu
              trigger={<IconButton icon={ICONS.menuHorizontal} size="24px" />}
              items={menuItems}
            />
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <p className={clsx("body-reg-2", styles.owner)}>
          {[owner && getUserDisplayName(owner), formatDate(board.createdAt)].filter(Boolean).join("  |  ")}
        </p>
        {showInfoLink && (
          <Link to="/boards/$id/info" params={{ id: board.id }} className={clsx("btn-font-s", styles.info)}>
            {boardsTexts.about}
            <Icon as={ICONS.rightArrow} size="16px" inheritColor />
          </Link>
        )}
      </div>
    </div>
  );
}
