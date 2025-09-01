"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthAndUserInitializer } from "./AuthAndUserInitializer";
import { GlobalModalProvider } from "./GlobalModalContext";
import { GlobalModalManager } from "./GlobalModalManager";
import { handleGlobalError } from "@/shared/errors/handleGlobalError";

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

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => setIsClient(true), []);

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
