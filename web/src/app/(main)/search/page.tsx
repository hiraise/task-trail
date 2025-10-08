import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { SearchDesktopPage, SearchMobilePage } from "@/presentation/pages/search";

export default function SearchPage() {
  return <DeviceBased desktop={<SearchDesktopPage />} mobile={<SearchMobilePage />} />;
}
