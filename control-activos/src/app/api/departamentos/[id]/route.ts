import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { z } from "zod";

const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  location: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
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
    const body = updateDepartmentSchema.parse(rawBody);

    const department = await prisma.department.update({
      where: { id },
      data: body,
      include: {
        _count: {
          select: {
            users: true,
            assignments: true,
          },
        },
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
    }

    console.error("Error updating department:", error);
    return NextResponse.json({ error: "Error al actualizar departamento" }, { status: 500 });
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
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
    }

    console.error("Error deleting department:", error);
    return NextResponse.json({ error: "Error al eliminar departamento" }, { status: 500 });
  }
}
