import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import {
  createAssetAttachmentCaption,
  getAssetAttachmentKind,
} from "@/lib/asset-attachments";
import { prisma } from "@/lib/prisma";

const createAttachmentSchema = z.object({
  kind: z.enum(["PHOTO", "INVOICE"]),
  fileUrl: z.string().trim().min(1, "El archivo es requerido"),
  fileName: z.string().trim().min(1, "El nombre del archivo es requerido"),
  caption: z.string().trim().optional(),
  isPrimary: z.boolean().optional(),
});

function serializeAttachment(attachment: {
  id: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  uploadedAt: Date;
}) {
  return {
    ...attachment,
    kind: getAssetAttachmentKind(attachment.caption, attachment.url),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRoles(["ADMIN", "EDITOR", "USER"]);
    if (error) {
      return error;
    }

    const { id } = await params;

    const attachments = await prisma.assetPhoto.findMany({
      where: { assetId: id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(attachments.map(serializeAttachment));
  } catch (error) {
    console.error("Error listing asset attachments:", error);
    return NextResponse.json(
      { error: "No fue posible obtener los adjuntos" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const body = createAttachmentSchema.parse(rawBody);

    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });
    }

    const created = await prisma.$transaction(async (tx) => {
      if (body.kind === "PHOTO" && body.isPrimary) {
        await tx.assetPhoto.updateMany({
          where: { assetId: id },
          data: { isPrimary: false },
        });
      }

      return tx.assetPhoto.create({
        data: {
          assetId: id,
          url: body.fileUrl,
          caption: createAssetAttachmentCaption(body.kind, body.fileName, body.caption),
          isPrimary: body.kind === "PHOTO" ? Boolean(body.isPrimary) : false,
        },
      });
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "CREATE",
      entity: "asset_attachment",
      entityId: created.id,
      assetId: id,
      description:
        body.kind === "PHOTO"
          ? "Foto de activo agregada"
          : "Factura o comprobante de activo agregado",
      newValue: {
        kind: body.kind,
        fileName: body.fileName,
        url: created.url,
        isPrimary: created.isPrimary,
      },
    });

    return NextResponse.json(serializeAttachment(created), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    console.error("Error creating asset attachment:", error);
    return NextResponse.json(
      { error: "No fue posible guardar el adjunto" },
      { status: 500 }
    );
  }
}
