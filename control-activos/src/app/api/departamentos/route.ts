import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
});

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true,
            assignments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calcular valor total de activos por departamento
    const departmentsWithValue = await Promise.all(
      departments.map(async (dept) => {
        const assignments = await prisma.assignment.findMany({
          where: {
            departmentId: dept.id,
            status: "ACTIVE",
          },
          include: {
            asset: {
              select: {
                currentValue: true,
              },
            },
          },
        });

        const assetValue = assignments.reduce(
          (sum, a) => sum + (a.asset.currentValue || 0),
          0
        );

        return {
          ...dept,
          assetCount: assignments.length,
          assetValue,
        };
      })
    );

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
