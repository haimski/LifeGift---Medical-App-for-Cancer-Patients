import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "../globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "LifeGift — צוות",
  description: "לוח מעקב עבור צוות הטיפול האונקולוגי.",
};

/**
 * A separate root layout (its own <html>/<body>) from the patient app's —
 * see Next.js's "multiple root layouts via route groups" pattern. The
 * staff dashboard deliberately has none of the patient shell (no
 * SafetyHeader, no mobile-width constraint) and is always pinned to the
 * light theme via the `staff-light-theme` class (see globals.css), even if
 * the viewer's OS/browser is set to dark mode — this is professional
 * clinical tooling, not the patient's warmer, mobile-first chat.
 */
export default async function StaffRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} staff-light-theme h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
