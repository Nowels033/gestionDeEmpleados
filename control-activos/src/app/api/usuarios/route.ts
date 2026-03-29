import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
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

const LIST_CACHE_CONTROL = "private, max-age=20, stale-while-revalidate=120";

export async function GET(request: Request) {
  const startedAt = performance.now();
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "options") {
      const optionUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          lastName: true,
        },
        orderBy: [{ name: "asc" }, { lastName: "asc" }],
      });

      const durationMs = performance.now() - startedAt;
      if (process.env.NODE_ENV !== "production") {
        console.info(`[api] GET /api/usuarios?view=options ${durationMs.toFixed(1)}ms rows=${optionUsers.length}`);
      }

      return NextResponse.json(optionUsers, {
        headers: {
          "Cache-Control": LIST_CACHE_CONTROL,
          "Server-Timing": `total;dur=${durationMs.toFixed(1)}`,
        },
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        photo: true,
        employeeNumber: true,
        position: true,
        hireDate: true,
        role: true,
        isActive: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assignments: {
              where: { status: "ACTIVE" },
            },
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
      orderBy: { createdAt: "desc" },
    });

    const durationMs = performance.now() - startedAt;
    if (process.env.NODE_ENV !== "production") {
      console.info(`[api] GET /api/usuarios ${durationMs.toFixed(1)}ms rows=${users.length}`);
    }

    return NextResponse.json(users, {
      headers: {
        "Cache-Control": LIST_CACHE_CONTROL,
        "Server-Timing": `total;dur=${durationMs.toFixed(1)}`,
      },
    });
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
    const { error, session } = await requireRoles(["ADMIN"]);
    if (error || !session) {
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

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "CREATE",
      entity: "user",
      entityId: userWithoutPassword.id,
      description: `Usuario creado: ${userWithoutPassword.name} ${userWithoutPassword.lastName}`,
      newValue: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        employeeNumber: userWithoutPassword.employeeNumber,
        role: userWithoutPassword.role,
        departmentId: userWithoutPassword.departmentId,
      },
    });

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
