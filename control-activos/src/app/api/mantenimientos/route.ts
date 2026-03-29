import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { z } from "zod";

const createMaintenanceSchema = z.object({
  assetId: z.string().trim().min(1, "El activo es requerido"),
  type: z.enum(["PREVENTIVE", "CORRECTIVE", "EMERGENCY"]),
  description: z.string().trim().min(1, "La descripcion es requerida"),
  scheduledDate: z.coerce.date(),
  cost: z.coerce.number().nonnegative().optional(),
  technicianId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET() {
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const maintenanceLogs = await prisma.maintenanceLog.findMany({
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            qrCode: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledDate: "desc" },
    });

    return NextResponse.json(maintenanceLogs);
  } catch (error) {
    console.error("Error fetching maintenance logs:", error);
    return NextResponse.json(
      { error: "Error al obtener mantenimientos" },
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
    const body = createMaintenanceSchema.parse(rawBody);

    const maintenanceLog = await prisma.maintenanceLog.create({
      data: {
        assetId: body.assetId,
        type: body.type,
        description: body.description,
        scheduledDate: body.scheduledDate,
        cost: body.cost,
        technicianId: body.technicianId || null,
        notes: body.notes,
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            qrCode: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
        },
      },
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "CREATE",
      entity: "maintenance",
      entityId: maintenanceLog.id,
      assetId: maintenanceLog.asset.id,
      description: `Mantenimiento creado para ${maintenanceLog.asset.name}`,
      newValue: {
        type: maintenanceLog.type,
        status: maintenanceLog.status,
        scheduledDate: maintenanceLog.scheduledDate,
        cost: maintenanceLog.cost,
      },
    });

    return NextResponse.json(maintenanceLog, { status: 201 });
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

    console.error("Error creating maintenance log:", error);
    return NextResponse.json(
      { error: "Error al crear mantenimiento" },
      { status: 500 }
    );
  }
}
