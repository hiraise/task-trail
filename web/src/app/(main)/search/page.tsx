import { DeviceBased, SearchDesktopPage, SearchMobilePage } from "@/presentation/shared";

export default function SearchPage() {
  return <DeviceBased desktop={<SearchDesktopPage />} mobile={<SearchMobilePage />} />;
}
