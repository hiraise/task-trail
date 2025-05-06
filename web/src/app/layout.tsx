import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import { StoreProvider } from "./StoreProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  //TODO: move strings to text file
  title: "Task Trail",
  description: "Self-hosted система управления задачами",
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
          {children}
          <Toaster position="bottom-right" richColors />{" "}
        </StoreProvider>
      </body>
    </html>
  );
}
