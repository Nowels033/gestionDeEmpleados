import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido"),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
});

const LIST_CACHE_CONTROL = "private, max-age=20, stale-while-revalidate=120";

export async function GET(request: Request) {
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");

    if (view === "options") {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          icon: true,
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json(categories, {
        headers: {
          "Cache-Control": LIST_CACHE_CONTROL,
        },
      });
    }

    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { assets: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories, {
      headers: {
        "Cache-Control": LIST_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const rawBody = await request.json();
    const body = createCategorySchema.parse(rawBody);

    const category = await prisma.category.create({
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon,
        parentId: body.parentId || null,
      },
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: "CREATE",
      entity: "category",
      entityId: category.id,
      description: `Categoria creada: ${category.name}`,
      newValue: {
        id: category.id,
        name: category.name,
        parentId: category.parentId,
      },
    });

    return NextResponse.json(category, { status: 201 });
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

    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 }
    );
  }
}
