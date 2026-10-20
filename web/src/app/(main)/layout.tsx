"use client";

import { usePathname } from "next/navigation";

import { DeviceBased } from "@/presentation/shared";
import { BottomNavBar, DesktopTemplate } from "@/presentation/shared/components/Layout";
import { BOTTOM_NAV_PATHS } from "@/shared/config/routes";
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
