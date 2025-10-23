import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { BoardsDesktopPage, BoardsMobilePage } from "@/presentation/pages/boards";

export default function BoardsPage() {
  return <DeviceBased desktop={<BoardsDesktopPage />} mobile={<BoardsMobilePage />} />;
}
