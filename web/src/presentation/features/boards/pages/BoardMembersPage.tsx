import { useParams } from "@tanstack/react-router";

import type { BoardId } from "@/domain/types";
import { DeviceBased, RedirectScreen } from "@/presentation/shared";
import { PagesMobileTemplate } from "@/presentation/shared/components/Layout";
import { boardsTexts } from "@/shared/locales/boards";

import { BoardMemberGroups } from "../components";
import { useBoard, useIsBoardOwner } from "../hooks";

/** Board members — a phone page (frames 843:92288, 919:61858); wider, they are on the board info. */
export function BoardMembersPage() {
  const { id } = useParams({ from: "/_main/boards/$id/members" });

  return (
    <DeviceBased
      desktop={<RedirectScreen href={`/boards/${id}/info`} />}
      mobile={<MembersScreen boardId={id} />}
    />
  );
}

function MembersScreen({ boardId }: { boardId: BoardId }) {
  const { data: board } = useBoard(boardId);
  const isOwner = useIsBoardOwner(board);

  return (
    <PagesMobileTemplate topBarBackTitle={boardsTexts.members} variant="none">
      {board && <BoardMemberGroups board={board} isOwner={isOwner} />}
    </PagesMobileTemplate>
  );
}
