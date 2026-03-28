import { NextResponse } from "next/server";
import { auth } from "@/auth";

type Role = "ADMIN" | "EDITOR" | "USER";

export async function requireAuthenticated() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
      session: null,
    };
  }

  return { error: null, session };
}

export async function requireRoles(allowedRoles: Role[]) {
  const authResult = await requireAuthenticated();
  if (authResult.error || !authResult.session) {
    return authResult;
  }

  const role = authResult.session.user.role;
  if (!role || !allowedRoles.includes(role)) {
    return {
      error: NextResponse.json({ error: "No autorizado" }, { status: 403 }),
      session: authResult.session,
    };
  }

  return { error: null, session: authResult.session };
}
