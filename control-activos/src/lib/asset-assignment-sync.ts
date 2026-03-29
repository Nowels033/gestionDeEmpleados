import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

const MAINTENANCE_BLOCKING_STATUSES = ["PENDING", "IN_PROGRESS"] as const;

export async function syncAssetStatusFromAssignments(db: DbClient, assetId: string) {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    select: { id: true, status: true },
  });

  if (!asset) {
    return null;
  }

  if (asset.status === "RETIRED") {
    return "RETIRED";
  }

  const activeMaintenance = await db.maintenanceLog.count({
    where: {
      assetId,
      status: {
        in: [...MAINTENANCE_BLOCKING_STATUSES],
      },
    },
  });

  if (activeMaintenance > 0) {
    if (asset.status !== "MAINTENANCE") {
      await db.asset.update({
        where: { id: assetId },
        data: { status: "MAINTENANCE" },
      });
    }

    return "MAINTENANCE";
  }

  const activeAssignments = await db.assignment.count({
    where: {
      assetId,
      status: "ACTIVE",
    },
  });

  const targetStatus = activeAssignments > 0 ? "ASSIGNED" : "AVAILABLE";

  if (asset.status !== targetStatus) {
    await db.asset.update({
      where: { id: assetId },
      data: { status: targetStatus },
    });
  }

  return targetStatus;
}
