import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { syncAssetStatusFromAssignments } from "@/lib/asset-assignment-sync";
import {
  AssignmentTargetError,
  ensureAssignmentTargetIsValid,
} from "@/lib/assignment-targets";
import { z } from "zod";

class AssignmentOperationError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function lockAssetRow(tx: Prisma.TransactionClient, assetId: string) {
  await tx.$queryRaw`SELECT id FROM assets WHERE id = ${assetId} FOR UPDATE`;
}

const createAssignmentSchema = z
  .object({
    type: z.enum(["PERSONAL", "DEPARTAMENTAL"]),
    assetId: z.string().trim().min(1, "El activo es requerido"),
    userId: z.string().trim().optional(),
    departmentId: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERSONAL" && !data.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userId"],
        message: "Debes seleccionar un usuario para asignacion personal",
      });
    }

    if (data.type === "DEPARTAMENTAL" && !data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departmentId"],
        message: "Debes seleccionar un departamento para asignacion departamental",
      });
    }
  });

export async function GET() {
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const assignments = await prisma.assignment.findMany({
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Error al obtener asignaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const rawBody = await request.json();
    const body = createAssignmentSchema.parse(rawBody);

    const assignment = await prisma.$transaction(async (tx) => {
      await lockAssetRow(tx, body.assetId);

      const asset = await tx.asset.findUnique({
        where: { id: body.assetId },
        select: { id: true, status: true },
      });

      if (!asset) {
        throw new AssignmentOperationError("Activo no encontrado", 404);
      }

      if (asset.status === "RETIRED" || asset.status === "MAINTENANCE") {
        throw new AssignmentOperationError(
          "No se puede asignar un activo retirado o en mantenimiento",
          409
        );
      }

      const activeAssignment = await tx.assignment.findFirst({
        where: {
          assetId: body.assetId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (activeAssignment) {
        throw new AssignmentOperationError("El activo ya tiene una asignacion activa", 409);
      }

      const targetUserId = body.type === "PERSONAL" ? body.userId || null : null;
      const targetDepartmentId = body.type === "DEPARTAMENTAL" ? body.departmentId || null : null;

      await ensureAssignmentTargetIsValid(tx, body.type, targetUserId, targetDepartmentId);

      const createdAssignment = await tx.assignment.create({
        data: {
          type: body.type,
          assetId: body.assetId,
          userId: body.userId || null,
          departmentId: body.departmentId || null,
          notes: body.notes,
        },
        include: {
          asset: true,
          user: true,
          department: true,
        },
      });

      await syncAssetStatusFromAssignments(tx, body.assetId);

      await createAuditLog({
        db: tx,
        request,
        userId: session.user.id,
        action: "CREATE",
        entity: "assignment",
        entityId: createdAssignment.id,
        assetId: createdAssignment.assetId,
        description:
          createdAssignment.type === "PERSONAL"
            ? "Asignacion personal creada"
            : "Asignacion departamental creada",
        newValue: {
          type: createdAssignment.type,
          assetId: createdAssignment.assetId,
          userId: createdAssignment.userId,
          departmentId: createdAssignment.departmentId,
          status: createdAssignment.status,
        },
      });

      return createdAssignment;
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Datos invalidos",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    if (error instanceof AssignmentOperationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof AssignmentTargetError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Error al crear asignación" },
      { status: 500 }
    );
  }
}
