import type { NextAuthConfig } from "next-auth";

// /api/inventory-sync prüft selbst per Bearer-Token (Inventur-App)
const PUBLIC_PATHS = ["/login", "/setup", "/register", "/uploads", "/api/inventory-sync"];

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized: ({ auth, request }) => {
      const isPublic = PUBLIC_PATHS.some((path) =>
        request.nextUrl.pathname.startsWith(path)
      );
      if (isPublic) return true;
      return !!auth;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.organizationId = (user as { organizationId: string }).organizationId;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.organizationId = token.organizationId as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
