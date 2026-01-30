"use client";

import { mockBoards } from "@/application/dto/MockBoardDto";
import { EmptyListState, Icon } from "@/presentation/shared";
import { TasksDesktopTemplate, TopBarDesktop } from "@/presentation/shared/components/Layout";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ASSETS } from "@/shared/config/assets";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./BoardsDesktopPage.module.css";

export function BoardsDesktopPage() {
  const handleCreateBoard = () => {
    // eslint-disable-next-line no-console
    console.log("Create board");
  };

  let content: React.ReactElement = <h1>Boards list</h1>;
  // const boards = [];
  const boards = mockBoards;

  const topBar = (
    <TopBarDesktop
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
