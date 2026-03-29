import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
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
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const { id } = await params;
    const rawBody = await request.json();
    const body = updateDepartmentSchema.parse(rawBody);

    const previousDepartment = await prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        isActive: true,
      },
    });

    if (!previousDepartment) {
      return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
    }

    if (body.isActive === false && previousDepartment.isActive) {
      const activeAssignmentsCount = await prisma.assignment.count({
        where: {
          departmentId: id,
          status: "ACTIVE",
        },
      });

      if (activeAssignmentsCount > 0) {
        return NextResponse.json(
          {
            error:
              "No se puede desactivar el departamento porque tiene asignaciones activas. Transferelas o devuelvelas primero.",
          },
          { status: 409 }
        );
      }
    }

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

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "UPDATE",
      entity: "department",
      entityId: department.id,
      description: `Departamento actualizado: ${department.name}`,
      oldValue: previousDepartment,
      newValue: {
        id: department.id,
        name: department.name,
        description: department.description,
        location: department.location,
        isActive: department.isActive,
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, session } = await requireRoles(["ADMIN"]);
    if (error || !session) {
      return error;
    }

    const { id } = await params;
    const rawBody = await request.json().catch(() => null);
    const targetDepartmentId =
      rawBody && typeof rawBody.targetDepartmentId === "string"
        ? rawBody.targetDepartmentId
        : null;

    const department = await prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
            assignments: true,
            contracts: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
    }

    if (targetDepartmentId && targetDepartmentId === id) {
      return NextResponse.json(
        { error: "No puedes mover usuarios al mismo departamento que sera eliminado" },
        { status: 400 }
      );
    }

    if (targetDepartmentId) {
      const targetDepartment = await prisma.department.findUnique({
        where: { id: targetDepartmentId },
        select: { id: true, isActive: true },
      });

      if (!targetDepartment || !targetDepartment.isActive) {
        return NextResponse.json(
          { error: "El departamento destino no existe o esta inactivo" },
          { status: 400 }
        );
      }
    }

    if (department._count.users > 0) {
      if (!targetDepartmentId) {
        return NextResponse.json(
          {
            error: `No se puede eliminar ${department.name} porque tiene ${department._count.users} usuarios asignados. Selecciona un departamento destino para moverlos.`,
          },
          { status: 409 }
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.updateMany({
          where: { departmentId: id },
          data: { departmentId: targetDepartmentId },
        });

        await tx.assignment.updateMany({
          where: { departmentId: id },
          data: { departmentId: targetDepartmentId },
        });

        await tx.contract.updateMany({
          where: { departmentId: id },
          data: { departmentId: targetDepartmentId },
        });

        await tx.department.delete({ where: { id } });
      });

      await createAuditLog({
        request,
        userId: session.user.id,
        action: "DELETE",
        entity: "department",
        entityId: id,
        description: `Departamento eliminado: ${department.name}`,
        oldValue: {
          ...department,
          movedToDepartmentId: targetDepartmentId,
        },
      });

      return NextResponse.json({ ok: true });
    }

    if (!targetDepartmentId) {
      await prisma.$transaction(async (tx) => {
        await tx.assignment.updateMany({
          where: { departmentId: id },
          data: { departmentId: null },
        });

        await tx.contract.updateMany({
          where: { departmentId: id },
          data: { departmentId: null },
        });

        await tx.department.delete({ where: { id } });
      });

      await createAuditLog({
        request,
        userId: session.user.id,
        action: "DELETE",
        entity: "department",
        entityId: id,
        description: `Departamento eliminado: ${department.name}`,
        oldValue: {
          ...department,
          movedToDepartmentId: null,
        },
      });

      return NextResponse.json({ ok: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.assignment.updateMany({
        where: { departmentId: id },
        data: { departmentId: targetDepartmentId },
      });

      await tx.contract.updateMany({
        where: { departmentId: id },
        data: { departmentId: targetDepartmentId },
      });

      await tx.department.delete({ where: { id } });
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "DELETE",
      entity: "department",
      entityId: id,
      description: `Departamento eliminado: ${department.name}`,
      oldValue: {
        ...department,
        movedToDepartmentId: targetDepartmentId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
      return NextResponse.json(
        { error: "No se pudo eliminar el departamento por relaciones dependientes" },
        { status: 409 }
      );
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });
    }

    console.error("Error deleting department:", error);
    return NextResponse.json({ error: "Error al eliminar departamento" }, { status: 500 });
  }
}
