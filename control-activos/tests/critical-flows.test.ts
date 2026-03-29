import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient, type Prisma } from "@prisma/client";
import { syncAssetStatusFromAssignments } from "../src/lib/asset-assignment-sync";

const prisma = new PrismaClient();
const shouldSkip = !process.env.DATABASE_URL;

class RollbackError extends Error {
  constructor() {
    super("ROLLBACK_TEST_TX");
  }
}

async function withRollbackTransaction(
  callback: (tx: Prisma.TransactionClient) => Promise<void>
) {
  try {
    await prisma.$transaction(async (tx) => {
      await callback(tx);
      throw new RollbackError();
    });
  } catch (error) {
    if (error instanceof RollbackError) {
      return;
    }
    throw error;
  }
}

function uniqueSuffix(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function createFixture(tx: Prisma.TransactionClient, suffix: string) {
  const department = await tx.department.create({
    data: {
      name: `dep-${suffix}`,
      description: "Departamento de prueba",
      location: "Lab",
    },
  });

  const category = await tx.category.create({
    data: {
      name: `cat-${suffix}`,
      description: "Categoria de prueba",
    },
  });

  const securityUser = await tx.user.create({
    data: {
      email: `sec-${suffix}@test.local`,
      password: "test-pass",
      name: "Security",
      lastName: "User",
      employeeNumber: `SEC-${suffix}`,
      position: "Seguridad",
      hireDate: new Date("2024-01-01T00:00:00.000Z"),
      role: "ADMIN",
      isActive: true,
      departmentId: department.id,
    },
  });

  const assigneeOne = await tx.user.create({
    data: {
      email: `assignee-a-${suffix}@test.local`,
      password: "test-pass",
      name: "Assignee",
      lastName: "One",
      employeeNumber: `A1-${suffix}`,
      position: "Operaciones",
      hireDate: new Date("2024-01-01T00:00:00.000Z"),
      role: "USER",
      isActive: true,
      departmentId: department.id,
    },
  });

  const assigneeTwo = await tx.user.create({
    data: {
      email: `assignee-b-${suffix}@test.local`,
      password: "test-pass",
      name: "Assignee",
      lastName: "Two",
      employeeNumber: `A2-${suffix}`,
      position: "Operaciones",
      hireDate: new Date("2024-01-01T00:00:00.000Z"),
      role: "USER",
      isActive: true,
      departmentId: department.id,
    },
  });

  const asset = await tx.asset.create({
    data: {
      name: `asset-${suffix}`,
      serialNumber: `SER-${suffix}`,
      qrCode: `QR-${suffix}`,
      status: "AVAILABLE",
      ensLevel: "BASIC",
      categoryId: category.id,
      securityUserId: securityUser.id,
    },
  });

  return {
    department,
    securityUser,
    assigneeOne,
    assigneeTwo,
    asset,
  };
}

test(
  "assign flow sets asset as ASSIGNED",
  { skip: shouldSkip },
  async () => {
    await withRollbackTransaction(async (tx) => {
      const suffix = uniqueSuffix("assign");
      const fixture = await createFixture(tx, suffix);

      await tx.assignment.create({
        data: {
          type: "PERSONAL",
          status: "ACTIVE",
          assetId: fixture.asset.id,
          userId: fixture.assigneeOne.id,
        },
      });

      await syncAssetStatusFromAssignments(tx, fixture.asset.id);

      const asset = await tx.asset.findUnique({
        where: { id: fixture.asset.id },
        select: { status: true },
      });

      assert.equal(asset?.status, "ASSIGNED");
    });
  }
);

test(
  "transfer flow keeps one active assignment and asset assigned",
  { skip: shouldSkip },
  async () => {
    await withRollbackTransaction(async (tx) => {
      const suffix = uniqueSuffix("transfer");
      const fixture = await createFixture(tx, suffix);

      const firstAssignment = await tx.assignment.create({
        data: {
          type: "PERSONAL",
          status: "ACTIVE",
          assetId: fixture.asset.id,
          userId: fixture.assigneeOne.id,
        },
      });

      await tx.assignment.update({
        where: { id: firstAssignment.id },
        data: {
          status: "TRANSFERRED",
          returnedAt: new Date(),
        },
      });

      await tx.assignment.create({
        data: {
          type: "PERSONAL",
          status: "ACTIVE",
          assetId: fixture.asset.id,
          userId: fixture.assigneeTwo.id,
        },
      });

      await syncAssetStatusFromAssignments(tx, fixture.asset.id);

      const activeAssignments = await tx.assignment.count({
        where: {
          assetId: fixture.asset.id,
          status: "ACTIVE",
        },
      });

      const transferredAssignments = await tx.assignment.count({
        where: {
          assetId: fixture.asset.id,
          status: "TRANSFERRED",
        },
      });

      const asset = await tx.asset.findUnique({
        where: { id: fixture.asset.id },
        select: { status: true },
      });

      assert.equal(activeAssignments, 1);
      assert.equal(transferredAssignments, 1);
      assert.equal(asset?.status, "ASSIGNED");
    });
  }
);

test(
  "return flow sets asset as AVAILABLE",
  { skip: shouldSkip },
  async () => {
    await withRollbackTransaction(async (tx) => {
      const suffix = uniqueSuffix("return");
      const fixture = await createFixture(tx, suffix);

      const assignment = await tx.assignment.create({
        data: {
          type: "PERSONAL",
          status: "ACTIVE",
          assetId: fixture.asset.id,
          userId: fixture.assigneeOne.id,
        },
      });

      await tx.assignment.update({
        where: { id: assignment.id },
        data: {
          status: "RETURNED",
          returnedAt: new Date(),
        },
      });

      await syncAssetStatusFromAssignments(tx, fixture.asset.id);

      const asset = await tx.asset.findUnique({
        where: { id: fixture.asset.id },
        select: { status: true },
      });

      assert.equal(asset?.status, "AVAILABLE");
    });
  }
);

test(
  "maintenance flow sets MAINTENANCE and then restores assignment status",
  { skip: shouldSkip },
  async () => {
    await withRollbackTransaction(async (tx) => {
      const suffix = uniqueSuffix("maintenance");
      const fixture = await createFixture(tx, suffix);

      await tx.assignment.create({
        data: {
          type: "PERSONAL",
          status: "ACTIVE",
          assetId: fixture.asset.id,
          userId: fixture.assigneeOne.id,
        },
      });

      const maintenance = await tx.maintenanceLog.create({
        data: {
          assetId: fixture.asset.id,
          type: "PREVENTIVE",
          description: "Revisar bateria",
          status: "PENDING",
          scheduledDate: new Date(),
        },
      });

      await syncAssetStatusFromAssignments(tx, fixture.asset.id);

      let asset = await tx.asset.findUnique({
        where: { id: fixture.asset.id },
        select: { status: true },
      });

      assert.equal(asset?.status, "MAINTENANCE");

      await tx.maintenanceLog.update({
        where: { id: maintenance.id },
        data: {
          status: "COMPLETED",
          completedDate: new Date(),
        },
      });

      await syncAssetStatusFromAssignments(tx, fixture.asset.id);

      asset = await tx.asset.findUnique({
        where: { id: fixture.asset.id },
        select: { status: true },
      });

      assert.equal(asset?.status, "ASSIGNED");
    });
  }
);

test.after(async () => {
  await prisma.$disconnect();
});
