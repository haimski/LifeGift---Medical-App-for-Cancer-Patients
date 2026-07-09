import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/staffAuth";

/**
 * Optimistic auth check for page loads/navigation — redirects to
 * /staff/login if there's no session. This is a UX convenience, not the
 * real security boundary: per Next.js's own auth guidance, the actual
 * enforcement lives in the data source itself (GET /api/staff/sessions
 * independently calls `auth()` and returns 401), since layouts don't
 * re-run on every client-side navigation.
 */
export default async function ProtectedStaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session) {
    redirect("/staff/login");
  }

  return <>{children}</>;
}
