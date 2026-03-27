import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
        _count: {
          select: {
            assignments: {
              where: { status: "ACTIVE" },
            },
            documents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // No enviar contraseñas
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Hash de la contraseña (por ahora simple, después bcrypt)
    const hashedPassword = body.password || "changeme123";

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        lastName: body.lastName,
        phone: body.phone,
        employeeNumber: body.employeeNumber,
        position: body.position,
        hireDate: new Date(body.hireDate),
        role: body.role || "USER",
        departmentId: body.departmentId,
      },
      include: {
        department: true,
      },
    });

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
