import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
});

export async function GET() {
  try {
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
    const rawBody = await request.json();
    const body = createContractSchema.parse(rawBody);

    if (body.startDate > body.endDate) {
      return NextResponse.json(
        { error: "La fecha de inicio no puede ser mayor a la fecha de fin" },
        { status: 400 }
      );
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
