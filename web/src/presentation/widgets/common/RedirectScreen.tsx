"use client";

import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";
import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";

export default function RedirectScreen({ href }: { href: string }) {
  const router = useRouter();

  useLayoutEffect(() => {
    router.replace(href);
  }, [href, router]);

  return <LoadingScreen />;
}
