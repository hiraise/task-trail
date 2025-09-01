"use client";

import { usePathname } from "next/navigation";

import { useInitSession } from "@/application/auth/hooks/useInitSession";

export function AuthAndUserInitializer() {
  const pathName = usePathname();
  useInitSession(pathName);
  return null;
}
