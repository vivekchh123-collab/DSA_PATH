import "./globals.css";
import type { Metadata, Viewport } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "DSA Path",
  description: "Practice data structures and algorithms topic by topic, and track every problem you solve.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-dvh flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
