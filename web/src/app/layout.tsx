import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { ClientRootLayout } from "@/presentation/app";
import { metadataTexts } from "@/shared/locales/metadata";

import "./globals.css";

const manrope = localFont({
  src: [
    {
      path: "../../public/fonts/Manrope-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Manrope-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Manrope-Medium.ttf",
      weight: "550",
      style: "normal",
    },
    {
      path: "../../public/fonts/Manrope-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
});

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
      <body className={manrope.className}>
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  );
}
