import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
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
    const { error } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error) {
      return error;
    }

    const { id } = await params;
    const rawBody = await request.json();
    const body = updateCategorySchema.parse(rawBody);

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRoles(["ADMIN"]);
    if (error) {
      return error;
    }

    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
    }

    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Error al eliminar categoria" }, { status: 500 });
  }
}
