import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const { id, documentId } = await params;

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: id },
      select: { id: true, name: true, type: true, fileSize: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    await prisma.document.delete({ where: { id: documentId } });

    await createAuditLog({
      request: _request,
      userId: session.user.id,
      action: "DELETE",
      entity: "user_document",
      entityId: documentId,
      description: `Documento eliminado de usuario ${id}`,
      oldValue: document,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting user document:", error);
    return NextResponse.json(
      { error: "No fue posible eliminar el documento" },
      { status: 500 }
    );
  }
}
