import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "DSA Path",
  description:
    "Practice data structures and algorithms topic by topic, and track every problem you solve.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto">{children}</div>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
