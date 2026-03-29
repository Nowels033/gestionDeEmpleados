import type { Prisma, PrismaClient } from "@prisma/client";
import { syncAssetStatusFromAssignments } from "@/lib/asset-assignment-sync";

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface ConsistencyIssue {
  code: string;
  label: string;
  severity: "critical" | "warning";
  count: number;
  autoFixable: boolean;
  sampleIds: string[];
}

export interface ConsistencyHealthReport {
  checkedAt: string;
  healthy: boolean;
  totalIssues: number;
  issues: ConsistencyIssue[];
}

export interface ConsistencyFixSummary {
  code: string;
  label: string;
  affected: number;
}

export interface ConsistencyAutoFixResult {
  appliedAt: string;
  totalAffected: number;
  fixes: ConsistencyFixSummary[];
}

const OPEN_MAINTENANCE_STATUSES = ["PENDING", "IN_PROGRESS"] as const;

function issueSeverityFromCount(count: number): "critical" | "warning" {
  return count > 0 ? "critical" : "warning";
}

function toIssueCount(rows: Array<{ count: bigint | number }>) {
  if (rows.length === 0) {
    return 0;
  }

  return Number(rows[0]?.count ?? 0);
}

export async function getConsistencyHealthReport(
  db: DbClient
): Promise<ConsistencyHealthReport> {
  const issues: ConsistencyIssue[] = [];

  const duplicateActiveGroups = await db.assignment.groupBy({
    by: ["assetId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
    having: {
      assetId: {
        _count: { gt: 1 },
      },
    },
  });

  if (duplicateActiveGroups.length > 0) {
    issues.push({
      code: "duplicate_active_assignments",
      label: "Activos con multiples asignaciones activas",
      severity: issueSeverityFromCount(duplicateActiveGroups.length),
      count: duplicateActiveGroups.length,
      autoFixable: true,
      sampleIds: duplicateActiveGroups.slice(0, 5).map((entry) => entry.assetId),
    });
  }

  const invalidActiveTargetAssignments = await db.assignment.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { type: "PERSONAL", userId: null },
        { type: "PERSONAL", departmentId: { not: null } },
        { type: "DEPARTAMENTAL", departmentId: null },
        { type: "DEPARTAMENTAL", userId: { not: null } },
      ],
    },
    select: { id: true },
    take: 25,
  });

  if (invalidActiveTargetAssignments.length > 0) {
    issues.push({
      code: "active_assignments_invalid_target",
      label: "Asignaciones activas sin destino valido",
      severity: issueSeverityFromCount(invalidActiveTargetAssignments.length),
      count: invalidActiveTargetAssignments.length,
      autoFixable: true,
      sampleIds: invalidActiveTargetAssignments.slice(0, 5).map((entry) => entry.id),
    });
  }

  const activeAssignmentsWithInactiveUser = await db.assignment.findMany({
    where: {
      status: "ACTIVE",
      type: "PERSONAL",
      userId: { not: null },
      user: { isActive: false },
    },
    select: { id: true },
    take: 25,
  });

  if (activeAssignmentsWithInactiveUser.length > 0) {
    issues.push({
      code: "active_assignments_inactive_user",
      label: "Asignaciones activas apuntando a usuarios inactivos",
      severity: "critical",
      count: activeAssignmentsWithInactiveUser.length,
      autoFixable: true,
      sampleIds: activeAssignmentsWithInactiveUser.slice(0, 5).map((entry) => entry.id),
    });
  }

  const activeAssignmentsWithInactiveDepartment = await db.assignment.findMany({
    where: {
      status: "ACTIVE",
      type: "DEPARTAMENTAL",
      departmentId: { not: null },
      department: { isActive: false },
    },
    select: { id: true },
    take: 25,
  });

  if (activeAssignmentsWithInactiveDepartment.length > 0) {
    issues.push({
      code: "active_assignments_inactive_department",
      label: "Asignaciones activas apuntando a departamentos inactivos",
      severity: "critical",
      count: activeAssignmentsWithInactiveDepartment.length,
      autoFixable: true,
      sampleIds: activeAssignmentsWithInactiveDepartment.slice(0, 5).map((entry) => entry.id),
    });
  }

  const activeAssignmentsWithReturnedAt = await db.assignment.findMany({
    where: {
      status: "ACTIVE",
      returnedAt: { not: null },
    },
    select: { id: true },
    take: 25,
  });

  if (activeAssignmentsWithReturnedAt.length > 0) {
    issues.push({
      code: "active_assignments_with_returned_at",
      label: "Asignaciones activas con fecha de devolucion",
      severity: "warning",
      count: activeAssignmentsWithReturnedAt.length,
      autoFixable: true,
      sampleIds: activeAssignmentsWithReturnedAt.slice(0, 5).map((entry) => entry.id),
    });
  }

  const closedAssignmentsWithoutReturnedAt = await db.assignment.findMany({
    where: {
      status: { in: ["RETURNED", "TRANSFERRED"] },
      returnedAt: null,
    },
    select: { id: true },
    take: 25,
  });

  if (closedAssignmentsWithoutReturnedAt.length > 0) {
    issues.push({
      code: "closed_assignments_without_returned_at",
      label: "Asignaciones cerradas sin fecha de devolucion",
      severity: "warning",
      count: closedAssignmentsWithoutReturnedAt.length,
      autoFixable: true,
      sampleIds: closedAssignmentsWithoutReturnedAt.slice(0, 5).map((entry) => entry.id),
    });
  }

  const assignedWithoutActive = await db.asset.findMany({
    where: {
      status: "ASSIGNED",
      assignments: {
        none: { status: "ACTIVE" },
      },
    },
    select: { id: true },
    take: 25,
  });

  if (assignedWithoutActive.length > 0) {
    issues.push({
      code: "assets_assigned_without_active_assignment",
      label: "Activos marcados como asignados sin asignacion activa",
      severity: "critical",
      count: assignedWithoutActive.length,
      autoFixable: true,
      sampleIds: assignedWithoutActive.slice(0, 5).map((entry) => entry.id),
    });
  }

  const availableWithActive = await db.asset.findMany({
    where: {
      status: "AVAILABLE",
      assignments: {
        some: { status: "ACTIVE" },
      },
    },
    select: { id: true },
    take: 25,
  });

  if (availableWithActive.length > 0) {
    issues.push({
      code: "assets_available_with_active_assignment",
      label: "Activos disponibles con asignacion activa",
      severity: "critical",
      count: availableWithActive.length,
      autoFixable: true,
      sampleIds: availableWithActive.slice(0, 5).map((entry) => entry.id),
    });
  }

  const retiredWithActiveAssignments = await db.asset.findMany({
    where: {
      status: "RETIRED",
      assignments: {
        some: { status: "ACTIVE" },
      },
    },
    select: { id: true },
    take: 25,
  });

  if (retiredWithActiveAssignments.length > 0) {
    issues.push({
      code: "retired_assets_with_active_assignment",
      label: "Activos retirados con asignaciones activas",
      severity: "critical",
      count: retiredWithActiveAssignments.length,
      autoFixable: true,
      sampleIds: retiredWithActiveAssignments.slice(0, 5).map((entry) => entry.id),
    });
  }

  const maintenanceWithoutOpenLog = await db.asset.findMany({
    where: {
      status: "MAINTENANCE",
      maintenanceLogs: {
        none: {
          status: { in: [...OPEN_MAINTENANCE_STATUSES] },
        },
      },
    },
    select: { id: true },
    take: 25,
  });

  if (maintenanceWithoutOpenLog.length > 0) {
    issues.push({
      code: "maintenance_assets_without_open_log",
      label: "Activos en mantenimiento sin log abierto",
      severity: "warning",
      count: maintenanceWithoutOpenLog.length,
      autoFixable: true,
      sampleIds: maintenanceWithoutOpenLog.slice(0, 5).map((entry) => entry.id),
    });
  }

  const nonMaintenanceWithOpenLog = await db.asset.findMany({
    where: {
      status: { in: ["AVAILABLE", "ASSIGNED"] },
      maintenanceLogs: {
        some: {
          status: { in: [...OPEN_MAINTENANCE_STATUSES] },
        },
      },
    },
    select: { id: true },
    take: 25,
  });

  if (nonMaintenanceWithOpenLog.length > 0) {
    issues.push({
      code: "non_maintenance_assets_with_open_log",
      label: "Activos no marcados en mantenimiento con log abierto",
      severity: "warning",
      count: nonMaintenanceWithOpenLog.length,
      autoFixable: true,
      sampleIds: nonMaintenanceWithOpenLog.slice(0, 5).map((entry) => entry.id),
    });
  }

  const completedWithoutDate = await db.maintenanceLog.findMany({
    where: {
      status: "COMPLETED",
      completedDate: null,
    },
    select: { id: true },
    take: 25,
  });

  if (completedWithoutDate.length > 0) {
    issues.push({
      code: "completed_maintenance_without_date",
      label: "Mantenimientos completados sin fecha de finalizacion",
      severity: "warning",
      count: completedWithoutDate.length,
      autoFixable: true,
      sampleIds: completedWithoutDate.slice(0, 5).map((entry) => entry.id),
    });
  }

  const nonCompletedWithDate = await db.maintenanceLog.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS", "CANCELLED"] },
      completedDate: { not: null },
    },
    select: { id: true },
    take: 25,
  });

  if (nonCompletedWithDate.length > 0) {
    issues.push({
      code: "non_completed_maintenance_with_date",
      label: "Mantenimientos no completados con fecha de finalizacion",
      severity: "warning",
      count: nonCompletedWithDate.length,
      autoFixable: true,
      sampleIds: nonCompletedWithDate.slice(0, 5).map((entry) => entry.id),
    });
  }

  const invalidContractsCount = await db.$queryRawUnsafe<Array<{ count: bigint }>>(`
    SELECT COUNT(*)::bigint AS count
    FROM "contracts"
    WHERE "startDate" > "endDate"
  `);

  const invalidContracts = await db.$queryRawUnsafe<Array<{ id: string }>>(`
    SELECT id
    FROM "contracts"
    WHERE "startDate" > "endDate"
    ORDER BY "createdAt" DESC
    LIMIT 25
  `);

  const invalidContractsTotal = toIssueCount(invalidContractsCount);

  if (invalidContractsTotal > 0) {
    issues.push({
      code: "contracts_invalid_date_range",
      label: "Contratos con rango de fechas invalido",
      severity: "warning",
      count: invalidContractsTotal,
      autoFixable: false,
      sampleIds: invalidContracts.slice(0, 5).map((entry) => entry.id),
    });
  }

  return {
    checkedAt: new Date().toISOString(),
    healthy: issues.length === 0,
    totalIssues: issues.reduce((total, issue) => total + issue.count, 0),
    issues,
  };
}

export async function applyConsistencyAutoFixes(
  db: PrismaClient
): Promise<ConsistencyAutoFixResult> {
  const fixes: ConsistencyFixSummary[] = [];

  await db.$transaction(async (tx) => {
    const now = new Date();
    const touchedAssetIds = new Set<string>();

    const duplicateGroups = await tx.assignment.groupBy({
      by: ["assetId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
      having: {
        assetId: {
          _count: { gt: 1 },
        },
      },
    });

    let duplicateAssignmentsFixed = 0;
    for (const group of duplicateGroups) {
      const activeAssignments = await tx.assignment.findMany({
        where: {
          assetId: group.assetId,
          status: "ACTIVE",
        },
        select: { id: true, assetId: true },
        orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
      });

      const keep = activeAssignments[0];
      const toClose = activeAssignments.filter((assignment) => assignment.id !== keep?.id);
      if (toClose.length === 0) {
        continue;
      }

      await tx.assignment.updateMany({
        where: { id: { in: toClose.map((assignment) => assignment.id) } },
        data: {
          status: "TRANSFERRED",
          returnedAt: now,
        },
      });

      duplicateAssignmentsFixed += toClose.length;
      touchedAssetIds.add(group.assetId);
    }

    if (duplicateAssignmentsFixed > 0) {
      fixes.push({
        code: "duplicate_active_assignments",
        label: "Cierre de asignaciones activas duplicadas",
        affected: duplicateAssignmentsFixed,
      });
    }

    const invalidActiveTargetAssignments = await tx.assignment.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { type: "PERSONAL", userId: null },
          { type: "PERSONAL", departmentId: { not: null } },
          { type: "DEPARTAMENTAL", departmentId: null },
          { type: "DEPARTAMENTAL", userId: { not: null } },
        ],
      },
      select: {
        id: true,
        type: true,
        userId: true,
        departmentId: true,
        assetId: true,
      },
    });

    let activeTargetFixes = 0;
    for (const assignment of invalidActiveTargetAssignments) {
      if (assignment.type === "PERSONAL" && assignment.userId && assignment.departmentId) {
        await tx.assignment.update({
          where: { id: assignment.id },
          data: { departmentId: null },
        });
        activeTargetFixes += 1;
        touchedAssetIds.add(assignment.assetId);
        continue;
      }

      if (assignment.type === "DEPARTAMENTAL" && assignment.departmentId && assignment.userId) {
        await tx.assignment.update({
          where: { id: assignment.id },
          data: { userId: null },
        });
        activeTargetFixes += 1;
        touchedAssetIds.add(assignment.assetId);
        continue;
      }

      await tx.assignment.update({
        where: { id: assignment.id },
        data: {
          status: "RETURNED",
          returnedAt: now,
        },
      });
      activeTargetFixes += 1;
      touchedAssetIds.add(assignment.assetId);
    }

    if (activeTargetFixes > 0) {
      fixes.push({
        code: "active_assignments_invalid_target",
        label: "Normalizacion de asignaciones activas sin destino valido",
        affected: activeTargetFixes,
      });
    }

    const activeAssignmentsWithInactiveUser = await tx.assignment.findMany({
      where: {
        status: "ACTIVE",
        type: "PERSONAL",
        userId: { not: null },
        user: { isActive: false },
      },
      select: { id: true, assetId: true },
    });

    if (activeAssignmentsWithInactiveUser.length > 0) {
      await tx.assignment.updateMany({
        where: { id: { in: activeAssignmentsWithInactiveUser.map((assignment) => assignment.id) } },
        data: {
          status: "RETURNED",
          returnedAt: now,
        },
      });

      activeAssignmentsWithInactiveUser.forEach((assignment) => {
        touchedAssetIds.add(assignment.assetId);
      });

      fixes.push({
        code: "active_assignments_inactive_user",
        label: "Cierre de asignaciones activas con usuarios inactivos",
        affected: activeAssignmentsWithInactiveUser.length,
      });
    }

    const activeAssignmentsWithInactiveDepartment = await tx.assignment.findMany({
      where: {
        status: "ACTIVE",
        type: "DEPARTAMENTAL",
        departmentId: { not: null },
        department: { isActive: false },
      },
      select: { id: true, assetId: true },
    });

    if (activeAssignmentsWithInactiveDepartment.length > 0) {
      await tx.assignment.updateMany({
        where: {
          id: { in: activeAssignmentsWithInactiveDepartment.map((assignment) => assignment.id) },
        },
        data: {
          status: "RETURNED",
          returnedAt: now,
        },
      });

      activeAssignmentsWithInactiveDepartment.forEach((assignment) => {
        touchedAssetIds.add(assignment.assetId);
      });

      fixes.push({
        code: "active_assignments_inactive_department",
        label: "Cierre de asignaciones activas con departamentos inactivos",
        affected: activeAssignmentsWithInactiveDepartment.length,
      });
    }

    const resetReturnedAtResult = await tx.assignment.updateMany({
      where: {
        status: "ACTIVE",
        returnedAt: { not: null },
      },
      data: { returnedAt: null },
    });

    if (resetReturnedAtResult.count > 0) {
      fixes.push({
        code: "active_assignments_with_returned_at",
        label: "Limpieza de fechas de devolucion en asignaciones activas",
        affected: resetReturnedAtResult.count,
      });
    }

    const closedWithoutReturnedAt = await tx.assignment.findMany({
      where: {
        status: { in: ["RETURNED", "TRANSFERRED"] },
        returnedAt: null,
      },
      select: { id: true, assignedAt: true },
    });

    for (const assignment of closedWithoutReturnedAt) {
      await tx.assignment.update({
        where: { id: assignment.id },
        data: { returnedAt: assignment.assignedAt },
      });
    }

    if (closedWithoutReturnedAt.length > 0) {
      fixes.push({
        code: "closed_assignments_without_returned_at",
        label: "Normalizacion de fecha de devolucion en asignaciones cerradas",
        affected: closedWithoutReturnedAt.length,
      });
    }

    const retiredAssignments = await tx.assignment.findMany({
      where: {
        status: "ACTIVE",
        asset: { status: "RETIRED" },
      },
      select: { id: true, assetId: true },
    });

    if (retiredAssignments.length > 0) {
      await tx.assignment.updateMany({
        where: { id: { in: retiredAssignments.map((assignment) => assignment.id) } },
        data: {
          status: "RETURNED",
          returnedAt: now,
        },
      });

      retiredAssignments.forEach((assignment) => {
        touchedAssetIds.add(assignment.assetId);
      });

      fixes.push({
        code: "retired_assets_with_active_assignment",
        label: "Cierre de asignaciones activas sobre activos retirados",
        affected: retiredAssignments.length,
      });
    }

    const completedWithoutDate = await tx.maintenanceLog.findMany({
      where: {
        status: "COMPLETED",
        completedDate: null,
      },
      select: { id: true, assetId: true },
    });

    if (completedWithoutDate.length > 0) {
      await tx.maintenanceLog.updateMany({
        where: { id: { in: completedWithoutDate.map((entry) => entry.id) } },
        data: { completedDate: now },
      });

      completedWithoutDate.forEach((entry) => {
        touchedAssetIds.add(entry.assetId);
      });

      fixes.push({
        code: "completed_maintenance_without_date",
        label: "Actualizacion de fecha final para mantenimientos completados",
        affected: completedWithoutDate.length,
      });
    }

    const nonCompletedWithDate = await tx.maintenanceLog.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS", "CANCELLED"] },
        completedDate: { not: null },
      },
      select: { id: true, assetId: true },
    });

    if (nonCompletedWithDate.length > 0) {
      await tx.maintenanceLog.updateMany({
        where: { id: { in: nonCompletedWithDate.map((entry) => entry.id) } },
        data: { completedDate: null },
      });

      nonCompletedWithDate.forEach((entry) => {
        touchedAssetIds.add(entry.assetId);
      });

      fixes.push({
        code: "non_completed_maintenance_with_date",
        label: "Limpieza de fecha final en mantenimientos no completados",
        affected: nonCompletedWithDate.length,
      });
    }

    const assetsWithPotentialMismatch = await tx.asset.findMany({
      where: {
        OR: [
          {
            status: "ASSIGNED",
            assignments: {
              none: { status: "ACTIVE" },
            },
          },
          {
            status: "AVAILABLE",
            assignments: {
              some: { status: "ACTIVE" },
            },
          },
          {
            status: "MAINTENANCE",
            maintenanceLogs: {
              none: {
                status: { in: [...OPEN_MAINTENANCE_STATUSES] },
              },
            },
          },
          {
            status: { in: ["AVAILABLE", "ASSIGNED"] },
            maintenanceLogs: {
              some: {
                status: { in: [...OPEN_MAINTENANCE_STATUSES] },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    assetsWithPotentialMismatch.forEach((asset) => touchedAssetIds.add(asset.id));

    let syncedAssets = 0;
    for (const assetId of touchedAssetIds) {
      await syncAssetStatusFromAssignments(tx, assetId);
      syncedAssets += 1;
    }

    if (syncedAssets > 0) {
      fixes.push({
        code: "asset_status_sync",
        label: "Sincronizacion de estado de activos",
        affected: syncedAssets,
      });
    }
  });

  return {
    appliedAt: new Date().toISOString(),
    totalAffected: fixes.reduce((total, fix) => total + fix.affected, 0),
    fixes,
  };
}
