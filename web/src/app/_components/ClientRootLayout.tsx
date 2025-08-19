"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";

import { store } from "@/infrastructure/redux/store";
import { GlobalErrorBanner } from "./GlobalErrorBanner";
import { AuthAndUserInitializer } from "./AuthAndUserInitializer";
import { GlobalModalProvider } from "./GlobalModalContext";
import { GlobalModalManager } from "./GlobalModalManager";

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
    <Provider store={store}>
      <Toaster position="bottom-right" richColors />
      <GlobalErrorBanner />
      <AuthAndUserInitializer />
      <GlobalModalProvider>
        {children}
        <GlobalModalManager />
      </GlobalModalProvider>
    </Provider>
  );
}
