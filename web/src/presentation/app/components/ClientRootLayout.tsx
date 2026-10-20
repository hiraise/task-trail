"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { handleGlobalError } from "@/shared/errors/handleGlobalError";

import { AuthAndUserInitializer } from "./AuthAndUserInitializer";
import { GlobalModalProvider } from "./GlobalModalContext";
import { GlobalModalManager } from "./GlobalModalManager";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Connect with TanStack Query DevTools
declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: QueryClient;
  }
}

if (typeof window !== "undefined") {
  window.__TANSTACK_QUERY_CLIENT__ = queryClient;
}

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsClient(true), 0);
  }, []);

  // If not client-side, return null to avoid rendering on the server
  if (!isClient) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="bottom-right" richColors />
      <AuthAndUserInitializer />
      <GlobalModalProvider>
        {children}
        <GlobalModalManager />
      </GlobalModalProvider>
    </QueryClientProvider>
  );
}
