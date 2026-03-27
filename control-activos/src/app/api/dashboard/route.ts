import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Contar activos por estado
    const totalAssets = await prisma.asset.count();
    const assignedAssets = await prisma.asset.count({
      where: { status: "ASSIGNED" },
    });
    const availableAssets = await prisma.asset.count({
      where: { status: "AVAILABLE" },
    });
    const maintenanceAssets = await prisma.asset.count({
      where: { status: "MAINTENANCE" },
    });
    const retiredAssets = await prisma.asset.count({
      where: { status: "RETIRED" },
    });

    // Valor total
    const assetsWithValue = await prisma.asset.findMany({
      select: { currentValue: true },
    });
    const totalValue = assetsWithValue.reduce(
      (sum, a) => sum + (a.currentValue || 0),
      0
    );

    // Activos por categoría
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    const categoryStats = categories.map((cat) => ({
      name: cat.name,
      value: cat._count.assets,
      icon: cat.icon,
    }));

    // Activos recientes
    const recentAssets = await prisma.asset.findMany({
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
    });

    // Departamentos
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const assignments = await prisma.assignment.findMany({
          where: {
            departmentId: dept.id,
            status: "ACTIVE",
          },
          include: {
            asset: {
              select: { currentValue: true },
            },
          },
        });

        const assetValue = assignments.reduce(
          (sum, a) => sum + (a.asset.currentValue || 0),
          0
        );

        return {
          name: dept.name,
          employeeCount: dept._count.users,
          assetCount: assignments.length,
          assetValue,
        };
      })
    );

    // Usuarios totales
    const totalUsers = await prisma.user.count();

    // Mantenimiento pendiente
    const pendingMaintenance = await prisma.maintenanceLog
      ? await prisma.maintenanceLog.count({
          where: { status: "PENDING" },
        })
      : 0;

    return NextResponse.json({
      stats: {
        totalAssets,
        assignedAssets,
        availableAssets,
        maintenanceAssets,
        retiredAssets,
        totalValue,
        totalUsers,
        pendingMaintenance,
      },
      categoryStats,
      recentAssets,
      departmentStats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
