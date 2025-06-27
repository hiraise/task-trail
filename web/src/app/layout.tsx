import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import { StoreProvider } from "./StoreProvider";
import { AuthRedirectWatcher } from "@/presentation/ui/AuthRedirectWatcher";
import { metadataTexts } from "@/shared/locales/metadata";
import { ClientOnly } from "./ClientOnly";
import UserInitializer from "./UserInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: metadataTexts.app.title,
  description: metadataTexts.app.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreProvider>
          <Toaster position="bottom-right" richColors />
          <UserInitializer />
          <AuthRedirectWatcher />
          <ClientOnly>{children}</ClientOnly>
        </StoreProvider>
      </body>
    </html>
  );
}
