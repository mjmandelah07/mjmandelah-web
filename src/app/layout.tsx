import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { SessionProvider } from "@/components/session";
import "./globals.css";

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans-app",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-app",
});

export const metadata: Metadata = {
  title: "Mjmandelah",
  description: "Retail and wholesale counter for Mjmandelah store",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
