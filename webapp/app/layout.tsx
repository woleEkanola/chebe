import type { Metadata } from "next";
import "./globals.css";
import { ChebeProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Chebe — Parent Dashboard",
  description: "Central command center for screen time, safety alerts, location and parenting assistant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">
        <ChebeProvider>{children}</ChebeProvider>
      </body>
    </html>
  );
}
