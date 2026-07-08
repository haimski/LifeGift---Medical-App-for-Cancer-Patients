import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SafetyHeader } from "@/components/layout/SafetyHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LifeGift",
  description:
    "A calm place to check in about symptoms during cancer treatment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SafetyHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
