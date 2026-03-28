import { NextResponse } from "next/server";
import { getAssetAttachmentKind } from "@/lib/asset-attachments";
import { requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { error } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error) {
      return error;
    }

    const { id, attachmentId } = await params;

    const attachment = await prisma.assetPhoto.findFirst({
      where: { id: attachmentId, assetId: id },
      select: { id: true, caption: true, url: true },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Adjunto no encontrado" }, { status: 404 });
    }

    if (getAssetAttachmentKind(attachment.caption, attachment.url) !== "PHOTO") {
      return NextResponse.json(
        { error: "Solo las fotos pueden marcarse como principal" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.assetPhoto.updateMany({
        where: { assetId: id },
        data: { isPrimary: false },
      });

      await tx.assetPhoto.update({
        where: { id: attachmentId },
        data: { isPrimary: true },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating asset attachment:", error);
    return NextResponse.json(
      { error: "No fue posible actualizar la foto principal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { error } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error) {
      return error;
    }

    const { id, attachmentId } = await params;

    const attachment = await prisma.assetPhoto.findFirst({
      where: { id: attachmentId, assetId: id },
      select: { id: true },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Adjunto no encontrado" }, { status: 404 });
    }

    await prisma.assetPhoto.delete({ where: { id: attachmentId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting asset attachment:", error);
    return NextResponse.json(
      { error: "No fue posible eliminar el adjunto" },
      { status: 500 }
    );
  }
}
