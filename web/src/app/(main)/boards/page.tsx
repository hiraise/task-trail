import { BoardsDesktopPage, BoardsMobilePage } from "@/presentation/features/boards/pages";
import { DeviceBased } from "@/presentation/shared";

export default function BoardsPage() {
  return <DeviceBased desktop={<BoardsDesktopPage />} mobile={<BoardsMobilePage />} />;
}
