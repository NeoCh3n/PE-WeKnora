import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedFlame · Decision CI",
  description: "Pull requests and CI tests for investment decisions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
