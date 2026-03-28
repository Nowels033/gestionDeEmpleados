import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);
      const isApiAuthRoute = pathname.startsWith("/api/auth");
      const isPublicRoute = pathname === "/login";
      const isApiRoute = pathname.startsWith("/api/");

      if (isApiAuthRoute) {
        return true;
      }

      if (isPublicRoute && isLoggedIn) {
        return NextResponse.redirect(new URL("/", request.nextUrl));
      }

      if (!isLoggedIn && isApiRoute) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }

      return isPublicRoute || isLoggedIn;
    },
  },
};

export default authConfig;
