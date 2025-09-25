"use client";

import styles from "./BoardsDesktopPage.module.css";

import { mockBoards } from "@/domain/board/board.mocks";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { TopBar } from "@/presentation/widgets/common/TopBar";
import { TEXTS } from "@/shared/locales/texts";
import { TasksDesktopTemplate } from "@/presentation/templates";
import { EmptyListState } from "@/presentation/widgets/common/EmptyListState/EmptyListState";
import { ASSETS } from "@/infrastructure/config/assets";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

export function BoardsDesktopPage() {
  const handleCreateBoard = () => {
    console.log("Create board");
  };

  let content: React.ReactElement = <h1>Boards list</h1>;
  // const boards = [];
  const boards = mockBoards;

  const topBar = (
    <TopBar
      title={TEXTS.drawer.myBoards}
      buttonText={TEXTS.boards.createButton}
      onClick={handleCreateBoard}
    />
  );
  //TODO: implement archived tasks UI

  if (boards.length === 0)
    content = (
      <EmptyListState
        src={ASSETS.images.board}
        alt={TEXTS.projects.projectAlt}
        text={TEXTS.boards.empty}
        btnLabel={TEXTS.boards.createButton}
        onClick={handleCreateBoard}
      />
    );

  return (
    <TasksDesktopTemplate topBar={topBar}>
      <div className={styles.container}>
        <SortButton />
        {content}
      </div>
    </TasksDesktopTemplate>
  );
}

function SortButton() {
  const { showSortOptions } = useGlobalModals();
  return (
    <button onClick={showSortOptions} className={styles.sortButton}>
      <Icon as={ICONS.sort} size="24px" inheritColor />
    </button>
  );
}
