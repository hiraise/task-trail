import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { metadataTexts } from "@/shared/locales/metadata";
import LoadingScreen from "@/presentation/widgets/common/LoadingScreen";
import ClientRootLayout from "./_components/ClientRootLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: metadataTexts.app.title,
  description: metadataTexts.app.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div id="loading-screen">
          <LoadingScreen />
        </div>
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  );
}
