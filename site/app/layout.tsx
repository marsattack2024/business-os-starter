// This file wraps every page on the site.
// The only thing you might want to change here is the title and
// description below — that is the text people see in the browser tab
// and in Google search results.

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "{{BUSINESS_NAME}}",
  description: "{{TAGLINE}}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-page font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
