import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Part 2 — Component Engineering Challenge",
  description: "Reusable typed data table with server-side pagination and sorting"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
