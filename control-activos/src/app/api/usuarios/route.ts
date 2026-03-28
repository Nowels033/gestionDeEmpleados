import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email("Email invalido").toLowerCase(),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
  name: z.string().trim().min(1, "El nombre es requerido"),
  lastName: z.string().trim().min(1, "Los apellidos son requeridos"),
  phone: z.string().trim().optional(),
  employeeNumber: z.string().trim().min(1, "El numero de empleado es requerido"),
  position: z.string().trim().min(1, "El puesto es requerido"),
  hireDate: z.coerce.date(),
  role: z.enum(["ADMIN", "EDITOR", "USER"]).default("USER"),
  departmentId: z.string().trim().min(1, "El departamento es requerido"),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Error interno del servidor";
}

export async function GET() {
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

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
    const usersWithoutPassword = users.map((user) => {
      const { password: removedPassword, ...safeUser } = user;
      void removedPassword;
      return safeUser;
    });

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
    const { error } = await requireRoles(["ADMIN"]);
    if (error) {
      return error;
    }

    const rawBody = await request.json();
    const body = createUserSchema.parse(rawBody);
    const hashedPassword = await bcrypt.hash(body.password, 12);

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

    const { password: removedPassword, ...userWithoutPassword } = user;
    void removedPassword;
    return NextResponse.json(userWithoutPassword, { status: 201 });
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
        { error: "Ya existe un usuario con ese email o numero de empleado" },
        { status: 409 }
      );
    }

    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
