import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { syncAssetStatusFromAssignments } from "@/lib/asset-assignment-sync";
import { z } from "zod";

const updateAssignmentSchema = z.object({
  status: z.enum(["ACTIVE", "RETURNED", "TRANSFERRED"]).optional(),
  type: z.enum(["PERSONAL", "DEPARTAMENTAL"]).optional(),
  userId: z.string().trim().nullable().optional(),
  departmentId: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  returnedAt: z.coerce.date().nullable().optional(),
});

function validateDestination(
  type: "PERSONAL" | "DEPARTAMENTAL",
  userId: string | null,
  departmentId: string | null
) {
  if (type === "PERSONAL" && !userId) {
    return "Debes seleccionar un usuario para asignacion personal";
  }

  if (type === "DEPARTAMENTAL" && !departmentId) {
    return "Debes seleccionar un departamento para asignacion departamental";
  }

  return null;
}

function hasTransferPayload(body: z.infer<typeof updateAssignmentSchema>) {
  return body.type !== undefined || body.userId !== undefined || body.departmentId !== undefined;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const { id } = await params;
    const rawBody = await request.json();
    const body = updateAssignmentSchema.parse(rawBody);

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        id: true,
        assetId: true,
        assignedAt: true,
        returnedAt: true,
        status: true,
        type: true,
        userId: true,
        departmentId: true,
        notes: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Asignacion no encontrada" }, { status: 404 });
    }

    const nextType = body.type ?? assignment.type;
    const nextUserId = body.userId !== undefined ? body.userId : assignment.userId;
    const nextDepartmentId =
      body.departmentId !== undefined ? body.departmentId : assignment.departmentId;

    const destinationError = validateDestination(nextType, nextUserId, nextDepartmentId);
    if (destinationError) {
      return NextResponse.json({ error: destinationError }, { status: 400 });
    }

    const destinationChanged =
      nextType !== assignment.type ||
      nextUserId !== assignment.userId ||
      nextDepartmentId !== assignment.departmentId;

    if (body.status === "TRANSFERRED" && hasTransferPayload(body) && !destinationChanged) {
      return NextResponse.json(
        { error: "Selecciona un destino diferente para transferir" },
        { status: 400 }
      );
    }

    const isTransferOperation =
      body.status === "TRANSFERRED" && hasTransferPayload(body) && destinationChanged;

    if (body.status === "ACTIVE") {
      const conflictingActiveAssignment = await prisma.assignment.findFirst({
        where: {
          id: { not: assignment.id },
          assetId: assignment.assetId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      if (conflictingActiveAssignment) {
        return NextResponse.json(
          { error: "El activo ya tiene otra asignacion activa" },
          { status: 409 }
        );
      }
    }

    if (isTransferOperation && assignment.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Solo se pueden transferir asignaciones activas" },
        { status: 409 }
      );
    }

    if (isTransferOperation) {
      const transferredAssignment = await prisma.$transaction(async (tx) => {
        const previousAssignment = await tx.assignment.update({
          where: { id },
          data: {
            status: "TRANSFERRED",
            returnedAt: body.returnedAt || new Date(),
          },
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                category: { select: { name: true } },
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
        });

        const createdAssignment = await tx.assignment.create({
          data: {
            type: nextType,
            status: "ACTIVE",
            assetId: assignment.assetId,
            userId: nextType === "PERSONAL" ? nextUserId : null,
            departmentId: nextType === "DEPARTAMENTAL" ? nextDepartmentId : null,
            notes: body.notes !== undefined ? body.notes : assignment.notes,
          },
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                category: { select: { name: true } },
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
        });

        await syncAssetStatusFromAssignments(tx, assignment.assetId);

        await createAuditLog({
          db: tx,
          request,
          userId: session.user.id,
          action: "TRANSFER",
          entity: "assignment",
          entityId: assignment.id,
          assetId: assignment.assetId,
          description: `Asignacion transferida (${assignment.id})`,
          oldValue: {
            id: assignment.id,
            type: assignment.type,
            status: assignment.status,
            userId: assignment.userId,
            departmentId: assignment.departmentId,
            assignedAt: assignment.assignedAt,
            returnedAt: assignment.returnedAt,
          },
          newValue: {
            transferredAssignmentId: previousAssignment.id,
            newAssignmentId: createdAssignment.id,
            type: createdAssignment.type,
            userId: createdAssignment.userId,
            departmentId: createdAssignment.departmentId,
            status: createdAssignment.status,
          },
        });

        return createdAssignment;
      });

      return NextResponse.json(transferredAssignment);
    }

    const updatedAssignment = await prisma.$transaction(async (tx) => {
      const data: {
        status?: "ACTIVE" | "RETURNED" | "TRANSFERRED";
        type?: "PERSONAL" | "DEPARTAMENTAL";
        userId?: string | null;
        departmentId?: string | null;
        notes?: string | null;
        returnedAt?: Date | null;
      } = {};

      if (body.status !== undefined) {
        data.status = body.status;
      }

      if (body.type !== undefined) {
        data.type = body.type;
      }

      if (body.userId !== undefined || body.type !== undefined) {
        data.userId = nextType === "PERSONAL" ? nextUserId : null;
      }

      if (body.departmentId !== undefined || body.type !== undefined) {
        data.departmentId = nextType === "DEPARTAMENTAL" ? nextDepartmentId : null;
      }

      if (body.notes !== undefined) {
        data.notes = body.notes;
      }

      if (body.status === "RETURNED" || body.status === "TRANSFERRED") {
        data.returnedAt = body.returnedAt || new Date();
      } else if (body.status === "ACTIVE") {
        data.returnedAt = null;
      } else if (body.returnedAt !== undefined) {
        data.returnedAt = body.returnedAt;
      }

      const updated = await tx.assignment.update({
        where: { id },
        data,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              category: { select: { name: true } },
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
      });

      await syncAssetStatusFromAssignments(tx, assignment.assetId);

      await createAuditLog({
        db: tx,
        request,
        userId: session.user.id,
        action: "UPDATE",
        entity: "assignment",
        entityId: assignment.id,
        assetId: assignment.assetId,
        description: `Asignacion actualizada (${assignment.id})`,
        oldValue: assignment,
        newValue: {
          status: updated.status,
          type: updated.type,
          userId: updated.userId,
          departmentId: updated.departmentId,
          returnedAt: updated.returnedAt,
          notes: updated.notes,
        },
      });

      return updated;
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    console.error("Error updating assignment:", error);
    return NextResponse.json({ error: "Error al actualizar asignacion" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        id: true,
        assetId: true,
        status: true,
        type: true,
        userId: true,
        departmentId: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Asignacion no encontrada" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.assignment.delete({ where: { id } });
      await syncAssetStatusFromAssignments(tx, assignment.assetId);

      await createAuditLog({
        db: tx,
        request,
        userId: session.user.id,
        action: "DELETE",
        entity: "assignment",
        entityId: assignment.id,
        assetId: assignment.assetId,
        description: `Asignacion eliminada (${assignment.id})`,
        oldValue: assignment,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json({ error: "Error al eliminar asignacion" }, { status: 500 });
  }
}
