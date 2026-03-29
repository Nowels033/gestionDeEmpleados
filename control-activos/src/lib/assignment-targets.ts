import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export type AssignmentTargetType = "PERSONAL" | "DEPARTAMENTAL";

export class AssignmentTargetError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function ensureAssignmentTargetIsValid(
  db: DbClient,
  type: AssignmentTargetType,
  userId: string | null,
  departmentId: string | null
) {
  if (type === "PERSONAL") {
    if (!userId) {
      throw new AssignmentTargetError("Debes seleccionar un usuario para asignacion personal");
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AssignmentTargetError("El usuario seleccionado no existe o esta inactivo", 409);
    }

    return;
  }

  if (!departmentId) {
    throw new AssignmentTargetError("Debes seleccionar un departamento para asignacion departamental");
  }

  const department = await db.department.findUnique({
    where: { id: departmentId },
    select: { id: true, isActive: true },
  });

  if (!department || !department.isActive) {
    throw new AssignmentTargetError("El departamento seleccionado no existe o esta inactivo", 409);
  }
}
