"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";

import { LoadingScreen } from "../LoadingScreen";

export function RedirectScreen({ href }: { href: string }) {
  const router = useRouter();

  useLayoutEffect(() => {
    router.replace(href);
  }, [href, router]);

  return <LoadingScreen />;
}
