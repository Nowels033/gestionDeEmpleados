import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import {
  applyConsistencyAutoFixes,
  getConsistencyHealthReport,
} from "@/lib/consistency-health";
import { prisma } from "@/lib/prisma";
import {
  ensureOperationalSqlConstraints,
  getOperationalConstraintStatus,
} from "@/lib/sql-constraints";

const applyConsistencySchema = z.object({
  autoFix: z.boolean().optional().default(false),
  applySqlConstraints: z.boolean().optional().default(false),
  confirmation: z.string().trim().optional(),
});

const AUTO_FIX_CONFIRMATION = "APLICAR_FIXES";

export async function GET() {
  try {
    const { error } = await requireRoles(["ADMIN"]);
    if (error) {
      return error;
    }

    const [health, constraints] = await Promise.all([
      getConsistencyHealthReport(prisma),
      getOperationalConstraintStatus(prisma),
    ]);

    return NextResponse.json({
      health,
      constraints,
      canAutoFix: health.issues.some((issue) => issue.autoFixable && issue.count > 0),
    });
  } catch (error) {
    console.error("Error checking consistency:", error);
    return NextResponse.json(
      { error: "No fue posible revisar la consistencia" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error, session } = await requireRoles(["ADMIN"]);
    if (error || !session) {
      return error;
    }

    const rawBody = await request.json();
    const body = applyConsistencySchema.parse(rawBody);

    if (!body.autoFix && !body.applySqlConstraints) {
      return NextResponse.json(
        { error: "Debes indicar al menos una accion" },
        { status: 400 }
      );
    }

    if (body.autoFix && body.confirmation !== AUTO_FIX_CONFIRMATION) {
      return NextResponse.json(
        { error: `Confirmacion requerida: ${AUTO_FIX_CONFIRMATION}` },
        { status: 400 }
      );
    }

    let autoFix = null;
    if (body.autoFix) {
      autoFix = await applyConsistencyAutoFixes(prisma);
    }

    let constraintsApplied = null;
    if (body.applySqlConstraints) {
      constraintsApplied = await ensureOperationalSqlConstraints(prisma);
    }

    const [health, constraints] = await Promise.all([
      getConsistencyHealthReport(prisma),
      getOperationalConstraintStatus(prisma),
    ]);

    await createAuditLog({
      request,
      userId: session.user.id,
      action: body.autoFix ? "AUTO_FIX" : "APPLY_CONSTRAINTS",
      entity: "consistency_health",
      entityId: `consistency-${Date.now()}`,
      description:
        body.autoFix && body.applySqlConstraints
          ? "Auto-fix y constraints SQL aplicados"
          : body.autoFix
            ? "Auto-fix de consistencia aplicado"
            : "Constraints SQL de consistencia aplicados",
      newValue: {
        autoFix,
        constraintsApplied,
        remainingIssues: health.totalIssues,
      },
    });

    return NextResponse.json({
      ok: true,
      autoFix,
      constraintsApplied,
      health,
      constraints,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Payload invalido" },
        { status: 400 }
      );
    }

    console.error("Error applying consistency actions:", error);
    return NextResponse.json(
      { error: "No fue posible aplicar acciones de consistencia" },
      { status: 500 }
    );
  }
}
