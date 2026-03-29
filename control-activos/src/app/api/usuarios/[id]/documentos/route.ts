import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

const createDocumentSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  type: z.enum(["INE", "CONTRATO", "DOMICILIO", "LICENCIA", "CV", "CERTIFICADO", "OTRO"]),
  fileUrl: z.string().trim().min(1, "El archivo es requerido"),
  fileSize: z.number().int().nonnegative(),
  mimeType: z.string().trim().min(1, "El tipo MIME es requerido"),
});

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
    const body = createDocumentSchema.parse(rawBody);

    const userExists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const document = await prisma.document.create({
      data: {
        userId: id,
        name: body.name,
        type: body.type,
        fileUrl: body.fileUrl,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
      },
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "CREATE",
      entity: "user_document",
      entityId: document.id,
      description: `Documento agregado a usuario ${id}`,
      newValue: {
        userId: id,
        name: document.name,
        type: document.type,
        fileSize: document.fileSize,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    console.error("Error creating user document:", error);
    return NextResponse.json(
      { error: "No fue posible guardar el documento" },
      { status: 500 }
    );
  }
}
