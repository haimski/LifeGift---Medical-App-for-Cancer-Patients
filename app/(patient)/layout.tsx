import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { SafetyHeader } from "@/components/layout/SafetyHeader";
import "../globals.css";

// Geist (the previous font) has no Hebrew glyphs — Heebo was designed for
// Hebrew and covers Latin too, so numbers/phone numbers still render fine.
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "LifeGift",
  description: "מקום שקט לבירור תסמינים במהלך הטיפול בסרטן.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          <SafetyHeader />
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
