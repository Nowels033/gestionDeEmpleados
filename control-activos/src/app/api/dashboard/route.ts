import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated } from "@/lib/api-auth";

const DASHBOARD_CACHE_CONTROL = "private, max-age=10, stale-while-revalidate=60";

export async function GET() {
  const startedAt = performance.now();
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const [
      totalAssets,
      assetStatusGroups,
      assetsWithValue,
      categories,
      recentAssets,
      departments,
      activeDepartmentAssignments,
      totalUsers,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
      prisma.asset.aggregate({
        _sum: {
          currentValue: true,
        },
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: { assets: true },
          },
        },
      }),
      prisma.asset.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.department.findMany({
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      prisma.assignment.findMany({
        where: {
          status: "ACTIVE",
          departmentId: { not: null },
        },
        select: {
          departmentId: true,
          asset: {
            select: { currentValue: true },
          },
        },
      }),
      prisma.user.count(),
    ]);

    const statusCount = assetStatusGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.status] = group._count._all;
      return acc;
    }, {});

    const assignedAssets = statusCount.ASSIGNED || 0;
    const availableAssets = statusCount.AVAILABLE || 0;
    const maintenanceAssets = statusCount.MAINTENANCE || 0;
    const retiredAssets = statusCount.RETIRED || 0;

    const totalValue = assetsWithValue._sum.currentValue || 0;

    const categoryStats = categories.map((cat) => ({
      name: cat.name,
      value: cat._count.assets,
      icon: cat.icon,
    }));

    const departmentAggregates = activeDepartmentAssignments.reduce<
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

    const departmentStats = departments.map((department) => ({
      name: department.name,
      employeeCount: department._count.users,
      assetCount: departmentAggregates[department.id]?.assetCount || 0,
      assetValue: departmentAggregates[department.id]?.assetValue || 0,
    }));

    const durationMs = performance.now() - startedAt;
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[api] GET /api/dashboard ${durationMs.toFixed(1)}ms totals assets=${totalAssets} users=${totalUsers}`
      );
    }

    return NextResponse.json({
      stats: {
        totalAssets,
        assignedAssets,
        availableAssets,
        maintenanceAssets,
        retiredAssets,
        totalValue,
        totalUsers,
      },
      categoryStats,
      recentAssets,
      departmentStats,
    },
    {
      headers: {
        "Cache-Control": DASHBOARD_CACHE_CONTROL,
        "Server-Timing": `total;dur=${durationMs.toFixed(1)}`,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      {
        stats: {
          totalAssets: 0,
          assignedAssets: 0,
          availableAssets: 0,
          maintenanceAssets: 0,
          retiredAssets: 0,
          totalValue: 0,
          totalUsers: 0,
        },
        categoryStats: [],
        recentAssets: [],
        departmentStats: [],
        error: "Error al obtener estadísticas",
      },
      { status: 500 }
    );
  }
}
