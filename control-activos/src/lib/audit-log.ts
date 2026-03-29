import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type AuditDbClient = PrismaClient | Prisma.TransactionClient;

const MAX_AUDIT_VALUE_LENGTH = 20_000;

export interface CreateAuditLogInput {
  action: string;
  entity: string;
  entityId: string;
  description: string;
  userId: string;
  assetId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  request?: Request;
  db?: AuditDbClient;
}

function getClientIpAddress(request?: Request): string | null {
  if (!request) {
    return null;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return null;
}

function serializeAuditValue(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const serialized =
    typeof value === "string"
      ? value
      : JSON.stringify(value, (_key, entryValue) => {
          if (entryValue instanceof Date) {
            return entryValue.toISOString();
          }
          return entryValue;
        });

  if (!serialized) {
    return null;
  }

  if (serialized.length <= MAX_AUDIT_VALUE_LENGTH) {
    return serialized;
  }

  return `${serialized.slice(0, MAX_AUDIT_VALUE_LENGTH)}...`;
}

export async function createAuditLog({
  action,
  entity,
  entityId,
  description,
  userId,
  assetId,
  oldValue,
  newValue,
  request,
  db,
}: CreateAuditLogInput): Promise<void> {
  try {
    const auditClient = db ?? prisma;

    await auditClient.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        description,
        userId,
        assetId: assetId ?? null,
        oldValue: serializeAuditValue(oldValue),
        newValue: serializeAuditValue(newValue),
        ipAddress: getClientIpAddress(request),
        userAgent: request?.headers.get("user-agent") ?? null,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
}
