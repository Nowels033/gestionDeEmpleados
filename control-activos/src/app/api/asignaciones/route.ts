import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import { z } from "zod";

const createAssignmentSchema = z
  .object({
    type: z.enum(["PERSONAL", "DEPARTAMENTAL"]),
    assetId: z.string().trim().min(1, "El activo es requerido"),
    userId: z.string().trim().optional(),
    departmentId: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "PERSONAL" && !data.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userId"],
        message: "Debes seleccionar un usuario para asignacion personal",
      });
    }

    if (data.type === "DEPARTAMENTAL" && !data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departmentId"],
        message: "Debes seleccionar un departamento para asignacion departamental",
      });
    }
  });

export async function GET() {
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const assignments = await prisma.assignment.findMany({
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Error al obtener asignaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error) {
      return error;
    }

    const rawBody = await request.json();
    const body = createAssignmentSchema.parse(rawBody);

    const asset = await prisma.asset.findUnique({
      where: { id: body.assetId },
      select: { id: true, status: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Activo no encontrado" }, { status: 404 });
    }

    if (asset.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Solo se pueden asignar activos disponibles" },
        { status: 409 }
      );
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.assignment.create({
        data: {
          type: body.type,
          assetId: body.assetId,
          userId: body.userId || null,
          departmentId: body.departmentId || null,
          notes: body.notes,
        },
        include: {
          asset: true,
          user: true,
          department: true,
        },
      });

      await tx.asset.update({
        where: { id: body.assetId },
        data: { status: "ASSIGNED" },
      });

      return createdAssignment;
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Datos invalidos",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Error al crear asignación" },
      { status: 500 }
    );
  }
}
