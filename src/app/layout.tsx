import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rezerv Data Table Challenge",
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
