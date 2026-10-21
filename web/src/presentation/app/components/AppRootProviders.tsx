import { Toaster } from "sonner";

import { GlobalModalProvider } from "./GlobalModalContext";
import { GlobalModalManager } from "./GlobalModalManager";

export default function AppRootProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Toaster position="bottom-right" richColors />
      <GlobalModalProvider>
        {children}
        <GlobalModalManager />
      </GlobalModalProvider>
    </>
  );
}
