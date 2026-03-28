import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";

const credentialsSchema = z.object({
  email: z.string().email("Email invalido").toLowerCase(),
  password: z.string().min(1, "La contrasena es requerida"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password: true,
            name: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.name} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user && "role" in user) {
        const role = user.role;
        if (role === "ADMIN" || role === "EDITOR" || role === "USER") {
          token.role = role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role =
          token.role === "ADMIN" || token.role === "EDITOR" || token.role === "USER"
            ? token.role
            : "USER";
      }

      return session;
    },
  },
});
