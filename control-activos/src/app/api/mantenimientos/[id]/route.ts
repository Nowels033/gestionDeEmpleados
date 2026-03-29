import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { syncAssetStatusFromAssignments } from "@/lib/asset-assignment-sync";
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
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const { id } = await params;
    const rawBody = await request.json();
    const body = updateMaintenanceSchema.parse(rawBody);

    const previousMaintenance = await prisma.maintenanceLog.findUnique({
      where: { id },
      select: {
        id: true,
        assetId: true,
        type: true,
        status: true,
        scheduledDate: true,
        completedDate: true,
        cost: true,
        technicianId: true,
      },
    });

    if (!previousMaintenance) {
      return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
    }

    const updateData: {
      type?: "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY";
      description?: string;
      status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
      scheduledDate?: Date;
      completedDate?: Date | null;
      cost?: number | null;
      technicianId?: string | null;
      notes?: string | null;
    } = {
      ...body,
    };

    if (body.status === "COMPLETED" && body.completedDate === undefined) {
      updateData.completedDate = new Date();
    }

    if (
      (body.status === "PENDING" || body.status === "IN_PROGRESS" || body.status === "CANCELLED") &&
      body.completedDate === undefined
    ) {
      updateData.completedDate = null;
    }

    const maintenanceLog = await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceLog.update({
        where: { id },
        data: updateData,
        include: {
          asset: {
            select: { id: true, name: true, qrCode: true },
          },
          technician: {
            select: { id: true, name: true, lastName: true },
          },
        },
      });

      await syncAssetStatusFromAssignments(tx, previousMaintenance.assetId);

      return updated;
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "UPDATE",
      entity: "maintenance",
      entityId: maintenanceLog.id,
      assetId: maintenanceLog.asset.id,
      description: `Mantenimiento actualizado para ${maintenanceLog.asset.name}`,
      oldValue: previousMaintenance,
      newValue: {
        type: maintenanceLog.type,
        status: maintenanceLog.status,
        scheduledDate: maintenanceLog.scheduledDate,
        completedDate: maintenanceLog.completedDate,
        cost: maintenanceLog.cost,
        technicianId: maintenanceLog.technician?.id || null,
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRoles(["ADMIN"]);
    if (error || !session) {
      return error;
    }

    const { id } = await params;
    const previousMaintenance = await prisma.maintenanceLog.findUnique({
      where: { id },
      select: {
        id: true,
        assetId: true,
        type: true,
        status: true,
        scheduledDate: true,
        completedDate: true,
        cost: true,
      },
    });

    if (!previousMaintenance) {
      return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.maintenanceLog.delete({ where: { id } });
      await syncAssetStatusFromAssignments(tx, previousMaintenance.assetId);
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "DELETE",
      entity: "maintenance",
      entityId: id,
      assetId: previousMaintenance.assetId,
      description: `Mantenimiento eliminado (${id})`,
      oldValue: previousMaintenance,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Mantenimiento no encontrado" }, { status: 404 });
    }

    console.error("Error deleting maintenance log:", error);
    return NextResponse.json({ error: "Error al eliminar mantenimiento" }, { status: 500 });
  }
}
