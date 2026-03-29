import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  icon: z.string().trim().nullable().optional(),
  parentId: z.string().trim().nullable().optional(),
});

export async function PATCH(
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
    const body = updateCategorySchema.parse(rawBody);

    const previousCategory = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        parentId: true,
      },
    });

    if (!previousCategory) {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: body,
      include: {
        _count: {
          select: { assets: true },
        },
        children: true,
      },
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "UPDATE",
      entity: "category",
      entityId: category.id,
      description: `Categoria actualizada: ${category.name}`,
      oldValue: previousCategory,
      newValue: {
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        parentId: category.parentId,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
    }

    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Error al actualizar categoria" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRoles(["ADMIN"]);
    if (error || !session) {
      return error;
    }

    const { id } = await params;
    const previousCategory = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        parentId: true,
      },
    });

    if (!previousCategory) {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "DELETE",
      entity: "category",
      entityId: id,
      description: `Categoria eliminada: ${previousCategory.name}`,
      oldValue: previousCategory,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
    }

    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Error al eliminar categoria" }, { status: 500 });
  }
}
