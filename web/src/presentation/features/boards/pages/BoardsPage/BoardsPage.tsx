import { useMemo } from "react";

import { ContentTopBarDesktop, ContentTopBarMobile, EmptyListState } from "@/presentation/shared";
import { TopBarDesktop, TopBarMobile } from "@/presentation/shared/components/Layout";
import { useListSort } from "@/presentation/shared/hooks";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ASSETS } from "@/shared/config/assets";
import { TEXTS } from "@/shared/locales/texts";
import { sortItems } from "@/shared/utils/sortItems";

import { BoardList } from "../../components";
import { useBoards } from "../../hooks";

import styles from "./BoardsPage.module.css";

/**
 * "My boards" (frames 805:87630, 911:60137, 1504:174848, 1772:144664, 1907:188972, 1772:143382).
 * On a phone — the top bar, wider — a header with a button and a card: CSS switches them (ADR-0008).
 */
export function BoardsPage() {
  const { showCreateBoard } = useGlobalModals();
  const { sort, openSort } = useListSort("boards");
  const { data: boards } = useBoards();
  const sorted = useMemo(() => boards && sortItems(boards, sort), [boards, sort]);

  return (
    <div className={styles.page}>
      <div className={styles.phoneTopBar}>
        <TopBarMobile title={TEXTS.drawer.myBoards} onClick={showCreateBoard} />
      </div>
      <div className={styles.wideTopBar}>
        <TopBarDesktop
          title={TEXTS.drawer.myBoards}
          buttonText={TEXTS.boards.createButton}
          onClick={showCreateBoard}
        />
      </div>
      <div className={styles.content}>
        <div className={styles.phoneOnly}>
          <ContentTopBarMobile onClick={openSort} tabs={false} />
        </div>
        <div className={styles.wideOnly}>
          <ContentTopBarDesktop onClick={openSort} tabs={false} />
        </div>
        {sorted &&
          (sorted.length > 0 ? (
            <BoardList boards={sorted} />
          ) : (
            <EmptyListState
              src={ASSETS.images.board}
              alt={TEXTS.boards.boardAlt}
              text={TEXTS.boards.empty}
              btnLabel={TEXTS.boards.createButton}
              onClick={showCreateBoard}
            />
          ))}
      </div>
    </div>
  );
}
