import { DeviceBased } from "../DeviceBased";
import { SearchDesktopPage } from "./SearchDesktopPage";
import { SearchMobilePage } from "./SearchMobilePage";

export function SearchPage() {
  return <DeviceBased desktop={<SearchDesktopPage />} mobile={<SearchMobilePage />} />;
}
