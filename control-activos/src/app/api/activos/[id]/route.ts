import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { z } from "zod";

const updateAssetSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  serialNumber: z.string().trim().nullable().optional(),
  brand: z.string().trim().nullable().optional(),
  model: z.string().trim().nullable().optional(),
  purchaseDate: z.coerce.date().nullable().optional(),
  purchasePrice: z.coerce.number().nonnegative().nullable().optional(),
  currentValue: z.coerce.number().nonnegative().nullable().optional(),
  status: z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"]).optional(),
  location: z.string().trim().nullable().optional(),
  qrCode: z.string().trim().nullable().optional(),
  ensLevel: z.enum(["BASIC", "MEDIUM", "HIGH"]).optional(),
  categoryId: z.string().trim().min(1).optional(),
  securityUserId: z.string().trim().min(1).optional(),
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
    const body = updateAssetSchema.parse(rawBody);

    const asset = await prisma.asset.update({
      where: { id },
      data: body,
      include: {
        category: true,
        securityUser: {
          select: { id: true, name: true, lastName: true },
        },
        photos: {
          select: {
            id: true,
            url: true,
            isPrimary: true,
            caption: true,
            uploadedAt: true,
          },
          orderBy: [{ isPrimary: "desc" }, { uploadedAt: "desc" }],
        },
        assignments: {
          where: { status: "ACTIVE" },
          select: {
            user: {
              select: { id: true, name: true, lastName: true },
            },
            department: {
              select: { id: true, name: true },
            },
          },
          take: 1,
          orderBy: { assignedAt: "desc" },
        },
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });
    }

    console.error("Error updating asset:", error);
    return NextResponse.json({ error: "Error al actualizar activo" }, { status: 500 });
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
    const assetExists = await prisma.asset.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!assetExists) {
      return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.assignment.deleteMany({ where: { assetId: id } });
      await tx.maintenanceLog.deleteMany({ where: { assetId: id } });
      await tx.contract.deleteMany({ where: { assetId: id } });
      await tx.auditLog.deleteMany({ where: { entity: "asset", entityId: id } });
      await tx.assetPhoto.deleteMany({ where: { assetId: id } });
      await tx.asset.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
      return NextResponse.json(
        { error: "No se pudo eliminar el activo por relaciones dependientes" },
        { status: 409 }
      );
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });
    }

    console.error("Error deleting asset:", error);
    return NextResponse.json({ error: "Error al eliminar activo" }, { status: 500 });
  }
}
