import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { z } from "zod";

const updateAssignmentSchema = z.object({
  status: z.enum(["ACTIVE", "RETURNED", "TRANSFERRED"]).optional(),
  type: z.enum(["PERSONAL", "DEPARTAMENTAL"]).optional(),
  userId: z.string().trim().nullable().optional(),
  departmentId: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  returnedAt: z.coerce.date().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error) {
      return error;
    }

    const { id } = await params;
    const rawBody = await request.json();
    const body = updateAssignmentSchema.parse(rawBody);

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true, assetId: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Asignacion no encontrada" }, { status: 404 });
    }

    const updatedAssignment = await prisma.$transaction(async (tx) => {
      const updated = await tx.assignment.update({
        where: { id },
        data: {
          ...body,
          returnedAt:
            body.status === "RETURNED" ? body.returnedAt || new Date() : body.returnedAt,
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

      if (body.status === "RETURNED") {
        await tx.asset.update({
          where: { id: assignment.assetId },
          data: { status: "AVAILABLE" },
        });
      }

      if (body.status === "ACTIVE" || body.status === "TRANSFERRED") {
        await tx.asset.update({
          where: { id: assignment.assetId },
          data: { status: "ASSIGNED" },
        });
      }

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error) {
      return error;
    }

    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { id: true, assetId: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Asignacion no encontrada" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.assignment.delete({ where: { id } });
      await tx.asset.update({
        where: { id: assignment.assetId },
        data: { status: "AVAILABLE" },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json({ error: "Error al eliminar asignacion" }, { status: 500 });
  }
}
