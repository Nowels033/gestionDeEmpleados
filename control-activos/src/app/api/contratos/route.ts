import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { z } from "zod";

const createContractSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  type: z.enum(["SERVICE", "WARRANTY", "INSURANCE", "LEASE", "LICENSE", "MAINTENANCE"]),
  provider: z.string().trim().min(1, "El proveedor es requerido"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  value: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().optional(),
  assetId: z.string().trim().optional(),
  departmentId: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (!data.assetId && !data.departmentId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["assetId"],
      message: "Debes vincular el contrato a un activo o a un departamento",
    });
  }
});

export async function GET() {
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const contracts = await prisma.contract.findMany({
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            qrCode: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { endDate: "asc" },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Error al obtener contratos" },
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
    const body = createContractSchema.parse(rawBody);

    if (body.startDate > body.endDate) {
      return NextResponse.json(
        { error: "La fecha de inicio no puede ser mayor a la fecha de fin" },
        { status: 400 }
      );
    }

    if (body.assetId) {
      const asset = await prisma.asset.findUnique({
        where: { id: body.assetId },
        select: { id: true },
      });

      if (!asset) {
        return NextResponse.json({ error: "Activo no encontrado" }, { status: 400 });
      }
    }

    if (body.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: body.departmentId },
        select: { id: true, isActive: true },
      });

      if (!department || !department.isActive) {
        return NextResponse.json(
          { error: "Departamento no encontrado o inactivo" },
          { status: 400 }
        );
      }
    }

    const contract = await prisma.contract.create({
      data: {
        name: body.name,
        type: body.type,
        provider: body.provider,
        startDate: body.startDate,
        endDate: body.endDate,
        value: body.value,
        notes: body.notes,
        assetId: body.assetId || null,
        departmentId: body.departmentId || null,
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            qrCode: true,
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

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "CREATE",
      entity: "contract",
      entityId: contract.id,
      assetId: contract.asset?.id || null,
      description: `Contrato creado: ${contract.name}`,
      newValue: {
        type: contract.type,
        status: contract.status,
        provider: contract.provider,
        startDate: contract.startDate,
        endDate: contract.endDate,
        value: contract.value,
      },
    });

    return NextResponse.json(contract, { status: 201 });
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

    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Error al crear contrato" },
      { status: 500 }
    );
  }
}
