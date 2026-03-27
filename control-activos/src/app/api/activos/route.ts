import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAssetSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  description: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  currentValue: z.coerce.number().nonnegative().optional(),
  location: z.string().trim().optional(),
  qrCode: z.string().trim().optional(),
  ensLevel: z.enum(["BASIC", "MEDIUM", "HIGH"]).default("BASIC"),
  categoryId: z.string().trim().min(1, "La categoria es requerida"),
  securityUserId: z.string().trim().min(1, "El responsable de seguridad es requerido"),
});

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      include: {
        category: true,
        securityUser: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
        },
        assignments: {
          where: { status: "ACTIVE" },
          include: {
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Error al obtener activos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const body = createAssetSchema.parse(rawBody);

    const asset = await prisma.asset.create({
      data: {
        name: body.name,
        description: body.description,
        serialNumber: body.serialNumber,
        brand: body.brand,
        model: body.model,
        purchaseDate: body.purchaseDate ?? null,
        purchasePrice: body.purchasePrice ?? null,
        currentValue: body.currentValue ?? null,
        location: body.location,
        qrCode: body.qrCode,
        ensLevel: body.ensLevel || "BASIC",
        categoryId: body.categoryId,
        securityUserId: body.securityUserId,
      },
      include: {
        category: true,
        securityUser: true,
      },
    });

    return NextResponse.json(asset, { status: 201 });
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "El numero de serie o codigo QR ya existe" },
        { status: 409 }
      );
    }

    console.error("Error creating asset:", error);
    return NextResponse.json(
      { error: "Error al crear activo" },
      { status: 500 }
    );
  }
}
