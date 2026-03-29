import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { z } from "zod";

const updateContractSchema = z.object({
  name: z.string().trim().min(1).optional(),
  type: z.enum(["SERVICE", "WARRANTY", "INSURANCE", "LEASE", "LICENSE", "MAINTENANCE"]).optional(),
  provider: z.string().trim().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  value: z.coerce.number().nonnegative().nullable().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "RENEWED"]).optional(),
  notes: z.string().trim().nullable().optional(),
  assetId: z.string().trim().nullable().optional(),
  departmentId: z.string().trim().nullable().optional(),
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
    const body = updateContractSchema.parse(rawBody);

    const previousContract = await prisma.contract.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        startDate: true,
        endDate: true,
        value: true,
        status: true,
        assetId: true,
        departmentId: true,
      },
    });

    if (!previousContract) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    const nextStartDate = body.startDate ?? previousContract.startDate;
    const nextEndDate = body.endDate ?? previousContract.endDate;
    const nextAssetId = body.assetId !== undefined ? body.assetId : previousContract.assetId;
    const nextDepartmentId =
      body.departmentId !== undefined ? body.departmentId : previousContract.departmentId;

    if (nextStartDate > nextEndDate) {
      return NextResponse.json(
        { error: "La fecha de inicio no puede ser mayor a la fecha de fin" },
        { status: 400 }
      );
    }

    if (!nextAssetId && !nextDepartmentId) {
      return NextResponse.json(
        { error: "Debes vincular el contrato a un activo o a un departamento" },
        { status: 400 }
      );
    }

    if (nextAssetId) {
      const asset = await prisma.asset.findUnique({
        where: { id: nextAssetId },
        select: { id: true },
      });

      if (!asset) {
        return NextResponse.json({ error: "Activo no encontrado" }, { status: 400 });
      }
    }

    if (nextDepartmentId) {
      const department = await prisma.department.findUnique({
        where: { id: nextDepartmentId },
        select: { id: true, isActive: true },
      });

      if (!department || !department.isActive) {
        return NextResponse.json(
          { error: "Departamento no encontrado o inactivo" },
          { status: 400 }
        );
      }
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: body,
      include: {
        asset: {
          select: { id: true, name: true, qrCode: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "UPDATE",
      entity: "contract",
      entityId: contract.id,
      assetId: contract.asset?.id || null,
      description: `Contrato actualizado: ${contract.name}`,
      oldValue: previousContract,
      newValue: {
        type: contract.type,
        status: contract.status,
        provider: contract.provider,
        startDate: contract.startDate,
        endDate: contract.endDate,
        value: contract.value,
        assetId: contract.asset?.id || null,
        departmentId: contract.department?.id || null,
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    console.error("Error updating contract:", error);
    return NextResponse.json({ error: "Error al actualizar contrato" }, { status: 500 });
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
    const previousContract = await prisma.contract.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        assetId: true,
        departmentId: true,
      },
    });

    if (!previousContract) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    await prisma.contract.delete({ where: { id } });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "DELETE",
      entity: "contract",
      entityId: id,
      assetId: previousContract.assetId,
      description: `Contrato eliminado: ${previousContract.name}`,
      oldValue: previousContract,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    console.error("Error deleting contract:", error);
    return NextResponse.json({ error: "Error al eliminar contrato" }, { status: 500 });
  }
}
