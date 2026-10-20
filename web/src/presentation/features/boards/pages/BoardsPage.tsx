import { DeviceBased } from "@/presentation/shared";

import { BoardsDesktopPage } from "./BoardsPage/BoardsDesktopPage";
import { BoardsMobilePage } from "./BoardsPage/BoardsMobilePage";

export function BoardsPage() {
  return <DeviceBased desktop={<BoardsDesktopPage />} mobile={<BoardsMobilePage />} />;
}
