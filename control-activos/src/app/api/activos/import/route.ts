import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { parseCsv } from "@/lib/csv-import";
import { prisma } from "@/lib/prisma";

const importAssetsSchema = z.object({
  csvContent: z.string().trim().min(1, "El contenido CSV es requerido"),
  commit: z.boolean().optional().default(false),
});

type NormalizedAssetStatus = "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED";
type NormalizedEnsLevel = "BASIC" | "MEDIUM" | "HIGH";

interface DraftAssetImportRow {
  rowNumber: number;
  fields: {
    name: string;
    category: string;
    securityEmail: string;
    status: string;
    ensLevel: string;
    brand: string;
    model: string;
    serialNumber: string;
    qrCode: string;
    location: string;
    purchasePrice: string;
    currentValue: string;
    purchaseDate: string;
    description: string;
  };
}

interface ValidAssetImportRow extends DraftAssetImportRow {
  parsed: {
    name: string;
    categoryId: string;
    securityUserId: string;
    status: NormalizedAssetStatus;
    ensLevel: NormalizedEnsLevel;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    qrCode: string | null;
    location: string | null;
    purchasePrice: number | null;
    currentValue: number | null;
    purchaseDate: Date | null;
    description: string | null;
  };
}

interface PreviewAssetImportRow extends DraftAssetImportRow {
  valid: boolean;
  errors: string[];
}

const columnAliases = {
  name: ["nombre", "name", "activo", "nombre_activo"],
  category: ["categoria", "category", "categoria_nombre"],
  securityEmail: [
    "responsable_email",
    "email_responsable",
    "security_email",
    "correo_responsable",
    "usuario_email",
  ],
  status: ["estado", "status"],
  ensLevel: ["nivel_ens", "ens", "ens_level"],
  brand: ["marca", "brand"],
  model: ["modelo", "model"],
  serialNumber: ["serial", "numero_serie", "serial_number"],
  qrCode: ["codigo_qr", "qr", "qr_code"],
  location: ["ubicacion", "location"],
  purchasePrice: ["precio_compra", "precio", "purchase_price"],
  currentValue: ["valor_actual", "valor", "current_value"],
  purchaseDate: ["fecha_compra", "purchase_date", "fecha_adquisicion"],
  description: ["descripcion", "description", "notas", "notes"],
} as const;

function pickCsvValue(
  row: Record<string, string>,
  aliases: readonly string[]
): string {
  for (const alias of aliases) {
    const value = row[alias];
    if (typeof value === "string") {
      return value.trim();
    }
  }

  return "";
}

function normalizeStatus(value: string): NormalizedAssetStatus | null {
  if (!value) {
    return "AVAILABLE";
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "AVAILABLE" || normalized === "DISPONIBLE") {
    return "AVAILABLE";
  }
  if (normalized === "ASSIGNED" || normalized === "ASIGNADO") {
    return "ASSIGNED";
  }
  if (normalized === "MAINTENANCE" || normalized === "MANTENIMIENTO") {
    return "MAINTENANCE";
  }
  if (normalized === "RETIRED" || normalized === "DADO_DE_BAJA" || normalized === "RETIRADO") {
    return "RETIRED";
  }

  return null;
}

function normalizeEnsLevel(value: string): NormalizedEnsLevel | null {
  if (!value) {
    return "BASIC";
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "BASIC" || normalized === "BASICO") {
    return "BASIC";
  }
  if (normalized === "MEDIUM" || normalized === "MEDIO") {
    return "MEDIUM";
  }
  if (normalized === "HIGH" || normalized === "ALTO") {
    return "HIGH";
  }

  return null;
}

function parseOptionalNumber(value: string): number | null | "invalid" {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return "invalid";
  }

  return parsed;
}

function parseOptionalDate(value: string): Date | null | "invalid" {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "invalid";
  }

  return parsed;
}

function toSetFrequency(values: string[]): Map<string, number> {
  return values.reduce((acc, value) => {
    acc.set(value, (acc.get(value) || 0) + 1);
    return acc;
  }, new Map<string, number>());
}

export async function POST(request: Request) {
  try {
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const rawBody = await request.json();
    const body = importAssetsSchema.parse(rawBody);

    const parsedCsv = parseCsv(body.csvContent);
    if (parsedCsv.rows.length === 0) {
      return NextResponse.json(
        { error: "El archivo no contiene filas para importar" },
        { status: 400 }
      );
    }

    const draftRows: DraftAssetImportRow[] = parsedCsv.rows.map((row, index) => ({
      rowNumber: index + 2,
      fields: {
        name: pickCsvValue(row, columnAliases.name),
        category: pickCsvValue(row, columnAliases.category),
        securityEmail: pickCsvValue(row, columnAliases.securityEmail).toLowerCase(),
        status: pickCsvValue(row, columnAliases.status),
        ensLevel: pickCsvValue(row, columnAliases.ensLevel),
        brand: pickCsvValue(row, columnAliases.brand),
        model: pickCsvValue(row, columnAliases.model),
        serialNumber: pickCsvValue(row, columnAliases.serialNumber),
        qrCode: pickCsvValue(row, columnAliases.qrCode),
        location: pickCsvValue(row, columnAliases.location),
        purchasePrice: pickCsvValue(row, columnAliases.purchasePrice),
        currentValue: pickCsvValue(row, columnAliases.currentValue),
        purchaseDate: pickCsvValue(row, columnAliases.purchaseDate),
        description: pickCsvValue(row, columnAliases.description),
      },
    }));

    const categoryByName = new Map<string, { id: string; name: string }[]>();
    const userByEmail = new Map<string, { id: string; name: string; lastName: string }>();

    const [categories, activeUsers] = await Promise.all([
      prisma.category.findMany({
        select: { id: true, name: true },
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, email: true, name: true, lastName: true },
      }),
    ]);

    categories.forEach((category) => {
      const key = category.name.trim().toLowerCase();
      const current = categoryByName.get(key) || [];
      current.push({ id: category.id, name: category.name });
      categoryByName.set(key, current);
    });

    activeUsers.forEach((user) => {
      userByEmail.set(user.email.trim().toLowerCase(), {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
      });
    });

    const payloadSerials = draftRows
      .map((row) => row.fields.serialNumber)
      .filter((value) => value !== "");
    const payloadQrCodes = draftRows.map((row) => row.fields.qrCode).filter((value) => value !== "");

    const serialFrequency = toSetFrequency(payloadSerials);
    const qrFrequency = toSetFrequency(payloadQrCodes);

    const duplicateConditions: Prisma.AssetWhereInput[] = [];
    if (payloadSerials.length > 0) {
      duplicateConditions.push({ serialNumber: { in: payloadSerials } });
    }
    if (payloadQrCodes.length > 0) {
      duplicateConditions.push({ qrCode: { in: payloadQrCodes } });
    }

    const existingAssets =
      duplicateConditions.length > 0
        ? await prisma.asset.findMany({
            where: { OR: duplicateConditions },
            select: { serialNumber: true, qrCode: true },
          })
        : [];

    const existingSerialSet = new Set(
      existingAssets.map((asset) => asset.serialNumber).filter((value): value is string => Boolean(value))
    );
    const existingQrSet = new Set(
      existingAssets.map((asset) => asset.qrCode).filter((value): value is string => Boolean(value))
    );

    const validRows: ValidAssetImportRow[] = [];

    const previewRows: PreviewAssetImportRow[] = draftRows.map((draftRow) => {
      const { fields } = draftRow;
      const errors: string[] = [];

      if (!fields.name) {
        errors.push("Nombre requerido");
      }

      if (!fields.category) {
        errors.push("Categoria requerida");
      }

      if (!fields.securityEmail) {
        errors.push("Email de responsable requerido");
      }

      const categoryMatches = fields.category
        ? categoryByName.get(fields.category.toLowerCase()) || []
        : [];

      if (fields.category && categoryMatches.length === 0) {
        errors.push("Categoria no encontrada");
      }

      if (categoryMatches.length > 1) {
        errors.push("Categoria ambigua, hay varias con el mismo nombre");
      }

      const responsibleUser = fields.securityEmail
        ? userByEmail.get(fields.securityEmail.toLowerCase())
        : undefined;

      if (fields.securityEmail && !responsibleUser) {
        errors.push("Responsable no encontrado o inactivo");
      }

      const normalizedStatus = normalizeStatus(fields.status);
      if (!normalizedStatus) {
        errors.push("Estado invalido");
      }

      if (normalizedStatus === "ASSIGNED") {
        errors.push("Estado ASSIGNED no permitido en importacion. Crea la asignacion despues de importar");
      }

      const normalizedEnsLevel = normalizeEnsLevel(fields.ensLevel);
      if (!normalizedEnsLevel) {
        errors.push("Nivel ENS invalido");
      }

      const purchasePrice = parseOptionalNumber(fields.purchasePrice);
      if (purchasePrice === "invalid") {
        errors.push("Precio de compra invalido");
      }

      const currentValue = parseOptionalNumber(fields.currentValue);
      if (currentValue === "invalid") {
        errors.push("Valor actual invalido");
      }

      const purchaseDate = parseOptionalDate(fields.purchaseDate);
      if (purchaseDate === "invalid") {
        errors.push("Fecha de compra invalida");
      }

      if (fields.serialNumber && (serialFrequency.get(fields.serialNumber) || 0) > 1) {
        errors.push("Numero de serie duplicado dentro del archivo");
      }

      if (fields.qrCode && (qrFrequency.get(fields.qrCode) || 0) > 1) {
        errors.push("Codigo QR duplicado dentro del archivo");
      }

      if (fields.serialNumber && existingSerialSet.has(fields.serialNumber)) {
        errors.push("Numero de serie ya existe en el inventario");
      }

      if (fields.qrCode && existingQrSet.has(fields.qrCode)) {
        errors.push("Codigo QR ya existe en el inventario");
      }

      const valid = errors.length === 0;

      if (valid) {
        validRows.push({
          ...draftRow,
          parsed: {
            name: fields.name,
            categoryId: categoryMatches[0]!.id,
            securityUserId: responsibleUser!.id,
            status: normalizedStatus!,
            ensLevel: normalizedEnsLevel!,
            brand: fields.brand || null,
            model: fields.model || null,
            serialNumber: fields.serialNumber || null,
            qrCode: fields.qrCode || null,
            location: fields.location || null,
            purchasePrice: purchasePrice === "invalid" ? null : purchasePrice,
            currentValue: currentValue === "invalid" ? null : currentValue,
            purchaseDate: purchaseDate === "invalid" ? null : purchaseDate,
            description: fields.description || null,
          },
        });
      }

      return {
        ...draftRow,
        valid,
        errors,
      };
    });

    const summary = {
      totalRows: draftRows.length,
      validRows: validRows.length,
      invalidRows: draftRows.length - validRows.length,
      canImport: validRows.length > 0 && validRows.length === draftRows.length,
    };

    if (!body.commit) {
      return NextResponse.json({ summary, rows: previewRows });
    }

    if (!summary.canImport) {
      return NextResponse.json(
        {
          error: "El archivo tiene filas invalidas. Corrige y vuelve a intentar.",
          summary,
          rows: previewRows,
        },
        { status: 400 }
      );
    }

    const createdAssets = await prisma.$transaction(async (tx) => {
      const created: { id: string; name: string }[] = [];

      for (const validRow of validRows) {
        const asset = await tx.asset.create({
          data: {
            name: validRow.parsed.name,
            description: validRow.parsed.description,
            serialNumber: validRow.parsed.serialNumber,
            brand: validRow.parsed.brand,
            model: validRow.parsed.model,
            purchaseDate: validRow.parsed.purchaseDate,
            purchasePrice: validRow.parsed.purchasePrice,
            currentValue: validRow.parsed.currentValue,
            status: validRow.parsed.status,
            location: validRow.parsed.location,
            qrCode: validRow.parsed.qrCode,
            ensLevel: validRow.parsed.ensLevel,
            categoryId: validRow.parsed.categoryId,
            securityUserId: validRow.parsed.securityUserId,
          },
          select: { id: true, name: true },
        });

        created.push(asset);

        await createAuditLog({
          db: tx,
          request,
          userId: session.user.id,
          action: "CREATE",
          entity: "asset",
          entityId: asset.id,
          assetId: asset.id,
          description: `Activo importado por CSV: ${asset.name}`,
          newValue: {
            source: "csv_import",
            rowNumber: validRow.rowNumber,
            fields: validRow.fields,
          },
        });
      }

      return created;
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "BULK_IMPORT",
      entity: "asset_import",
      entityId: `csv-${Date.now()}`,
      description: `Importacion masiva de activos (${createdAssets.length} registros)`,
      newValue: {
        createdCount: createdAssets.length,
        assetIds: createdAssets.map((asset) => asset.id),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        summary,
        createdCount: createdAssets.length,
        createdAssets,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Hay valores duplicados (serie o QR) en el archivo" },
        { status: 409 }
      );
    }

    console.error("Error importing assets from CSV:", error);
    return NextResponse.json(
      { error: "No fue posible importar el archivo" },
      { status: 500 }
    );
  }
}
