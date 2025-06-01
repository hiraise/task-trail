"use client";

import { ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LoadingScreen = dynamic(
  () => import("@/presentation/widgets/common/LoadingScreen"),
  { ssr: false }
);

export function ClientOnly({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

  return isClient ? children : <LoadingScreen />;
}
