import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Single shared staff login for v1 — no per-user accounts or roles yet, per
 * the plan's confirmed decision. Anyone who knows STAFF_PASSCODE (set only
 * in the Vercel project's env vars, never committed) can sign in; there's
 * no concept of "which staff member" beyond that. Protects only `/staff/*`
 * routes and APIs — patients never see a login (see the (protected) route
 * group's layout for where this is enforced).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        passcode: { label: "Passcode", type: "password" },
      },
      authorize(credentials) {
        const passcode = credentials?.passcode;
        const expected = process.env.STAFF_PASSCODE;
        if (
          typeof passcode === "string" &&
          typeof expected === "string" &&
          expected.length > 0 &&
          passcode === expected
        ) {
          // Minimal user object — there's no per-user identity in v1, just
          // "is this the shared staff login".
          return { id: "staff" };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/staff/login",
  },
  session: {
    strategy: "jwt",
  },
});
