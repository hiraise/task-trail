import { useRouter } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

import { LoadingScreen } from "../LoadingScreen";

export function RedirectScreen({ href }: { href: string }) {
  const router = useRouter();

  useLayoutEffect(() => {
    router.navigate({ to: href, replace: true });
  }, [href, router]);

  return <LoadingScreen />;
}
