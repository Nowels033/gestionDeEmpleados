import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export interface SqlConstraintStatus {
  name: string;
  type: "index" | "check";
  description: string;
  exists: boolean;
}

const REQUIRED_INDEXES: Array<{ name: string; description: string }> = [
  {
    name: "assignments_single_active_per_asset_idx",
    description: "Impide mas de una asignacion activa por activo",
  },
];

const REQUIRED_CHECKS: Array<{ name: string; description: string }> = [
  {
    name: "assignments_active_target_consistency_chk",
    description: "Asignaciones activas deben tener destino valido por tipo",
  },
  {
    name: "assignments_status_returned_at_chk",
    description: "Consistency entre estado de asignacion y fecha de devolucion",
  },
  {
    name: "contracts_date_range_chk",
    description: "Contratos no pueden tener fecha inicio mayor a fecha fin",
  },
  {
    name: "maintenance_completed_date_chk",
    description: "Mantenimientos completados deben registrar fecha",
  },
];

const SQL_STATEMENTS: Array<{ name: string; sql: string }> = [
  {
    name: "assignments_single_active_per_asset_idx",
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS "assignments_single_active_per_asset_idx"
      ON "assignments" ("assetId")
      WHERE "status" = 'ACTIVE';
    `,
  },
  {
    name: "assignments_active_target_consistency_chk",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'assignments_active_target_consistency_chk'
        ) THEN
          ALTER TABLE "assignments"
          ADD CONSTRAINT "assignments_active_target_consistency_chk"
          CHECK (
            "status" <> 'ACTIVE' OR (
              (
                "type" = 'PERSONAL' AND
                "userId" IS NOT NULL AND
                "departmentId" IS NULL
              ) OR (
                "type" = 'DEPARTAMENTAL' AND
                "departmentId" IS NOT NULL AND
                "userId" IS NULL
              )
            )
          );
        END IF;
      END $$;
    `,
  },
  {
    name: "assignments_status_returned_at_chk",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'assignments_status_returned_at_chk'
        ) THEN
          ALTER TABLE "assignments"
          ADD CONSTRAINT "assignments_status_returned_at_chk"
          CHECK (
            (
              "status" = 'ACTIVE' AND
              "returnedAt" IS NULL
            ) OR (
              "status" IN ('RETURNED', 'TRANSFERRED') AND
              "returnedAt" IS NOT NULL
            )
          );
        END IF;
      END $$;
    `,
  },
  {
    name: "contracts_date_range_chk",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'contracts_date_range_chk'
        ) THEN
          ALTER TABLE "contracts"
          ADD CONSTRAINT "contracts_date_range_chk"
          CHECK ("startDate" <= "endDate");
        END IF;
      END $$;
    `,
  },
  {
    name: "maintenance_completed_date_chk",
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'maintenance_completed_date_chk'
        ) THEN
          ALTER TABLE "maintenance_logs"
          ADD CONSTRAINT "maintenance_completed_date_chk"
          CHECK (
            (
              "status" = 'COMPLETED' AND
              "completedDate" IS NOT NULL
            ) OR (
              "status" <> 'COMPLETED' AND
              "completedDate" IS NULL
            )
          );
        END IF;
      END $$;
    `,
  },
];

export async function getOperationalConstraintStatus(
  db: DbClient
): Promise<SqlConstraintStatus[]> {
  const [indexRows, checkRows] = await Promise.all([
    db.$queryRawUnsafe<Array<{ indexname: string }>>(
      `
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = ANY($1)
      `,
      REQUIRED_INDEXES.map((entry) => entry.name)
    ),
    db.$queryRawUnsafe<Array<{ conname: string }>>(
      `
        SELECT conname
        FROM pg_constraint
        WHERE conname = ANY($1)
      `,
      REQUIRED_CHECKS.map((entry) => entry.name)
    ),
  ]);

  const existingIndexes = new Set(indexRows.map((row) => row.indexname));
  const existingChecks = new Set(checkRows.map((row) => row.conname));

  return [
    ...REQUIRED_INDEXES.map((index) => ({
      name: index.name,
      type: "index" as const,
      description: index.description,
      exists: existingIndexes.has(index.name),
    })),
    ...REQUIRED_CHECKS.map((check) => ({
      name: check.name,
      type: "check" as const,
      description: check.description,
      exists: existingChecks.has(check.name),
    })),
  ];
}

export async function ensureOperationalSqlConstraints(db: DbClient) {
  const applied: string[] = [];

  for (const statement of SQL_STATEMENTS) {
    try {
      await db.$executeRawUnsafe(statement.sql);
      applied.push(statement.name);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No fue posible aplicar constraints SQL";
      throw new Error(`${statement.name}: ${message}`);
    }
  }

  return {
    applied,
    total: applied.length,
  };
}
