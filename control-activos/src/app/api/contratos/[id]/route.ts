import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
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
    const { error } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error) {
      return error;
    }

    const { id } = await params;
    const rawBody = await request.json();
    const body = updateContractSchema.parse(rawBody);

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRoles(["ADMIN"]);
    if (error) {
      return error;
    }

    const { id } = await params;
    await prisma.contract.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    console.error("Error deleting contract:", error);
    return NextResponse.json({ error: "Error al eliminar contrato" }, { status: 500 });
  }
}
