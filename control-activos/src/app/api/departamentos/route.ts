import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await request.json();

    const department = await prisma.department.create({
      data: {
        name: body.name,
        description: body.description,
        location: body.location,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Error al crear departamento" },
      { status: 500 }
    );
  }
}
