import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function syncAssetStatusFromAssignments(db: DbClient, assetId: string) {
  const asset = await db.asset.findUnique({
    where: { id: assetId },
    select: { id: true, status: true },
  });

  if (!asset) {
    return null;
  }

  if (asset.status === "MAINTENANCE" || asset.status === "RETIRED") {
    return asset.status;
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
