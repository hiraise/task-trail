"use client";

import { usePathname } from "next/navigation";

import { DesktopTemplate } from "@/presentation/templates/DesktopTemplate";
import { DeviceBased } from "@/presentation/ui/DeviceBased";
import { BottomNavBar } from "@/presentation/widgets/dashboard/BottomNavBar";
import { BOTTOM_NAV_PATHS } from "@/infrastructure/config/routes";
import { normalize } from "@/shared/utils/formatters";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalizedPathname = normalize(pathname);

  const showBottomNavBar = BOTTOM_NAV_PATHS.map(normalize).includes(normalizedPathname);

  return (
    <DeviceBased
      mobile={
        <>
          {children}
          {showBottomNavBar && <BottomNavBar />}
        </>
      }
      desktop={<DesktopTemplate>{children}</DesktopTemplate>}
    />
  );
}
