import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EDITOR" | "USER";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "ADMIN" | "EDITOR" | "USER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "EDITOR" | "USER";
  }
}

export {};
