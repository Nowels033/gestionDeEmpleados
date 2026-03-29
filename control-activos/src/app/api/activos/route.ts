import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
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

const LIST_CACHE_CONTROL = "private, max-age=20, stale-while-revalidate=120";

export async function GET(request: Request) {
  const startedAt = performance.now();
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "options") {
      const optionAssets = await prisma.asset.findMany({
        select: {
          id: true,
          name: true,
          qrCode: true,
          status: true,
          assignments: {
            where: { status: "ACTIVE" },
            select: { id: true },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
      });

      const options = optionAssets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        qrCode: asset.qrCode,
        status: asset.status,
        hasActiveAssignment: asset.assignments.length > 0,
      }));

      const durationMs = performance.now() - startedAt;
      if (process.env.NODE_ENV !== "production") {
        console.info(`[api] GET /api/activos?view=options ${durationMs.toFixed(1)}ms rows=${options.length}`);
      }

      return NextResponse.json(options, {
        headers: {
          "Cache-Control": LIST_CACHE_CONTROL,
          "Server-Timing": `total;dur=${durationMs.toFixed(1)}`,
        },
      });
    }

    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        serialNumber: true,
        brand: true,
        model: true,
        purchasePrice: true,
        currentValue: true,
        status: true,
        location: true,
        qrCode: true,
        ensLevel: true,
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
        securityUser: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
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
          take: 1,
          orderBy: { assignedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const durationMs = performance.now() - startedAt;
    if (process.env.NODE_ENV !== "production") {
      console.info(`[api] GET /api/activos ${durationMs.toFixed(1)}ms rows=${assets.length}`);
    }

    return NextResponse.json(assets, {
      headers: {
        "Cache-Control": LIST_CACHE_CONTROL,
        "Server-Timing": `total;dur=${durationMs.toFixed(1)}`,
      },
    });
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
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

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

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "CREATE",
      entity: "asset",
      entityId: asset.id,
      assetId: asset.id,
      description: `Activo creado: ${asset.name}`,
      newValue: {
        name: asset.name,
        categoryId: asset.category.id,
        securityUserId: asset.securityUser.id,
        status: asset.status,
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
