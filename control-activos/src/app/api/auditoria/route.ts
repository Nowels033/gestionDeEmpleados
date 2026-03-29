import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRoles } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const filtersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
  entity: z.string().trim().optional(),
  action: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  q: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
});

function parseDateFilter(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function GET(request: Request) {
  try {
    const { error } = await requireRoles(["ADMIN", "EDITOR", "USER"]);
    if (error) {
      return error;
    }

    const { searchParams } = new URL(request.url);
    const parsedFilters = filtersSchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!parsedFilters.success) {
      return NextResponse.json({ error: "Filtros invalidos" }, { status: 400 });
    }

    const filters = parsedFilters.data;
    const normalizedEntity = filters.entity && filters.entity !== "all" ? filters.entity : undefined;
    const normalizedAction = filters.action && filters.action !== "all" ? filters.action : undefined;
    const normalizedUserId = filters.userId && filters.userId !== "all" ? filters.userId : undefined;
    const normalizedQuery = filters.q?.trim() || undefined;

    const fromDate = parseDateFilter(filters.from);
    const toDate = parseDateFilter(filters.to);

    if ((filters.from && !fromDate) || (filters.to && !toDate)) {
      return NextResponse.json({ error: "Rango de fechas invalido" }, { status: 400 });
    }

    const where: Prisma.AuditLogWhereInput = {};

    if (normalizedEntity) {
      where.entity = normalizedEntity;
    }

    if (normalizedAction) {
      where.action = normalizedAction;
    }

    if (normalizedUserId) {
      where.userId = normalizedUserId;
    }

    if (fromDate || toDate) {
      const createdAtFilter: Prisma.DateTimeFilter = {};

      if (fromDate) {
        createdAtFilter.gte = fromDate;
      }

      if (toDate) {
        const inclusiveToDate = new Date(toDate);
        inclusiveToDate.setHours(23, 59, 59, 999);
        createdAtFilter.lte = inclusiveToDate;
      }

      where.createdAt = createdAtFilter;
    }

    if (normalizedQuery) {
      where.OR = [
        {
          description: {
            contains: normalizedQuery,
            mode: "insensitive",
          },
        },
        {
          entityId: {
            contains: normalizedQuery,
            mode: "insensitive",
          },
        },
        {
          user: {
            OR: [
              { name: { contains: normalizedQuery, mode: "insensitive" } },
              { lastName: { contains: normalizedQuery, mode: "insensitive" } },
              { email: { contains: normalizedQuery, mode: "insensitive" } },
            ],
          },
        },
        {
          asset: {
            name: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const skip = (filters.page - 1) * filters.pageSize;

    const [items, total, entities, actions, users] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take: filters.pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          description: true,
          ipAddress: true,
          createdAt: true,
          oldValue: true,
          newValue: true,
          user: {
            select: {
              id: true,
              name: true,
              lastName: true,
              email: true,
            },
          },
          asset: {
            select: {
              id: true,
              name: true,
              qrCode: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        distinct: ["entity"],
        select: { entity: true },
        orderBy: { entity: "asc" },
      }),
      prisma.auditLog.findMany({
        distinct: ["action"],
        select: { action: true },
        orderBy: { action: "asc" },
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, lastName: true },
        orderBy: [{ name: "asc" }, { lastName: "asc" }],
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

    return NextResponse.json({
      items,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages,
      },
      filterOptions: {
        entities: entities.map((entry) => entry.entity),
        actions: actions.map((entry) => entry.action),
        users: users.map((user) => ({
          id: user.id,
          name: `${user.name} ${user.lastName}`,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "No fue posible obtener la bitacora" },
      { status: 500 }
    );
  }
}
