import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateUserSchema = z.object({
  email: z.string().email().toLowerCase().optional(),
  name: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().nullable().optional(),
  employeeNumber: z.string().trim().min(1).optional(),
  position: z.string().trim().min(1).optional(),
  hireDate: z.coerce.date().optional(),
  role: z.enum(["ADMIN", "EDITOR", "USER"]).optional(),
  isActive: z.boolean().optional(),
  photo: z.string().trim().nullable().optional(),
  departmentId: z.string().trim().min(1).optional(),
  password: z.string().min(8).optional(),
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
    const body = updateUserSchema.parse(rawBody);

    const data: Record<string, unknown> = { ...body };
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        department: true,
        _count: {
          select: {
            assignments: { where: { status: "ACTIVE" } },
            documents: true,
          },
        },
        documents: {
          select: {
            id: true,
            name: true,
            type: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
            uploadedAt: true,
          },
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    const { password, ...safeUser } = user;
    void password;
    return NextResponse.json(safeUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Email o numero de empleado ya registrado" },
        { status: 409 }
      );
    }

    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
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
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}
