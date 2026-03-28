import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import { z } from "zod";

const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
});

export async function GET() {
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const [departments, activeAssignments] = await Promise.all([
      prisma.department.findMany({
        include: {
          _count: {
            select: {
              users: true,
              assignments: true,
              contracts: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.assignment.findMany({
        where: {
          status: "ACTIVE",
          departmentId: { not: null },
        },
        select: {
          departmentId: true,
          asset: {
            select: {
              currentValue: true,
            },
          },
        },
      }),
    ]);

    const statsByDepartmentId = activeAssignments.reduce<
      Record<string, { assetCount: number; assetValue: number }>
    >((acc, assignment) => {
      if (!assignment.departmentId) {
        return acc;
      }

      const current = acc[assignment.departmentId] || { assetCount: 0, assetValue: 0 };
      current.assetCount += 1;
      current.assetValue += assignment.asset.currentValue || 0;
      acc[assignment.departmentId] = current;
      return acc;
    }, {});

    const departmentsWithValue = departments.map((department) => ({
      ...department,
      assetCount: statsByDepartmentId[department.id]?.assetCount || 0,
      assetValue: statsByDepartmentId[department.id]?.assetValue || 0,
    }));

    return NextResponse.json(departmentsWithValue);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Error al obtener departamentos" },
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
    const body = createDepartmentSchema.parse(rawBody);

    const department = await prisma.department.create({
      data: {
        name: body.name,
        description: body.description,
        location: body.location,
      },
    });

    return NextResponse.json(department, { status: 201 });
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un departamento con ese nombre" },
        { status: 409 }
      );
    }

    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Error al crear departamento" },
      { status: 500 }
    );
  }
}
