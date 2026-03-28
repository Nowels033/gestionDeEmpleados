import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalAssets,
      assignedAssets,
      availableAssets,
      maintenanceAssets,
      retiredAssets,
      assetsWithValue,
      categories,
      recentAssets,
      departments,
      activeDepartmentAssignments,
      totalUsers,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "ASSIGNED" } }),
      prisma.asset.count({ where: { status: "AVAILABLE" } }),
      prisma.asset.count({ where: { status: "MAINTENANCE" } }),
      prisma.asset.count({ where: { status: "RETIRED" } }),
      prisma.asset.findMany({ select: { currentValue: true } }),
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
        include: {
          category: true,
          assignments: {
            where: { status: "ACTIVE" },
            include: {
              user: {
                select: {
                  name: true,
                  lastName: true,
                },
              },
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

    const totalValue = assetsWithValue.reduce(
      (sum, a) => sum + (a.currentValue || 0),
      0
    );

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
