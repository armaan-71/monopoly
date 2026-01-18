import type { Metadata } from "next";
import "./globals.css";
import AppThemeProvider from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Monopoly Clone",
  description: "Real-time multiplayer Monopoly built with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
