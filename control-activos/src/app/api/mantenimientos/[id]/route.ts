import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { z } from "zod";

const updateMaintenanceSchema = z.object({
  type: z.enum(["PREVENTIVE", "CORRECTIVE", "EMERGENCY"]).optional(),
  description: z.string().trim().min(1).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  scheduledDate: z.coerce.date().optional(),
  completedDate: z.coerce.date().nullable().optional(),
  cost: z.coerce.number().nonnegative().nullable().optional(),
  technicianId: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
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
    const body = updateMaintenanceSchema.parse(rawBody);

    const maintenanceLog = await prisma.maintenanceLog.update({
      where: { id },
      data: body,
      include: {
        asset: {
          select: { id: true, name: true, qrCode: true },
        },
        technician: {
          select: { id: true, name: true, lastName: true },
        },
      },
    });

    return NextResponse.json(maintenanceLog);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
    }

    console.error("Error updating maintenance log:", error);
    return NextResponse.json({ error: "Error al actualizar mantenimiento" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRoles(["ADMIN"]);
    if (error) {
      return error;
    }

    const { id } = await params;
    await prisma.maintenanceLog.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
    }

    console.error("Error deleting maintenance log:", error);
    return NextResponse.json({ error: "Error al eliminar mantenimiento" }, { status: 500 });
  }
}
