import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAuthenticated, requireRoles } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

const APP_SETTINGS_SCOPE = "organization_default";

const updateSettingsSchema = z.object({
  settings: z.unknown(),
});

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  try {
    const { error } = await requireAuthenticated();
    if (error) {
      return error;
    }

    const appSetting = await prisma.appSetting.findUnique({
      where: { scope: APP_SETTINGS_SCOPE },
      select: {
        value: true,
        updatedAt: true,
        updatedByUserId: true,
      },
    });

    return NextResponse.json({
      settings: appSetting?.value ?? null,
      updatedAt: appSetting?.updatedAt ?? null,
      updatedByUserId: appSetting?.updatedByUserId ?? null,
    });
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return NextResponse.json(
      { error: "No fue posible obtener la configuracion" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { error, session } = await requireRoles(["ADMIN", "EDITOR"]);
    if (error || !session) {
      return error;
    }

    const rawBody = await request.json();
    const parsedBody = updateSettingsSchema.safeParse(rawBody);

    if (!parsedBody.success || !isJsonObject(parsedBody.data.settings)) {
      return NextResponse.json(
        { error: "Configuracion invalida" },
        { status: 400 }
      );
    }

    const settings = parsedBody.data.settings;

    const existingSetting = await prisma.appSetting.findUnique({
      where: { scope: APP_SETTINGS_SCOPE },
      select: {
        id: true,
        value: true,
      },
    });

    const savedSetting = await prisma.appSetting.upsert({
      where: { scope: APP_SETTINGS_SCOPE },
      create: {
        scope: APP_SETTINGS_SCOPE,
        value: settings as Prisma.InputJsonValue,
        updatedByUserId: session.user.id,
      },
      update: {
        value: settings as Prisma.InputJsonValue,
        updatedByUserId: session.user.id,
      },
      select: {
        id: true,
        value: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      request,
      userId: session.user.id,
      action: existingSetting ? "UPDATE" : "CREATE",
      entity: "app_setting",
      entityId: savedSetting.id,
      description: "Configuracion del sistema actualizada",
      oldValue: existingSetting?.value ?? null,
      newValue: savedSetting.value,
    });

    return NextResponse.json({
      ok: true,
      settings: savedSetting.value,
      updatedAt: savedSetting.updatedAt,
    });
  } catch (error) {
    console.error("Error saving app settings:", error);
    return NextResponse.json(
      { error: "No fue posible guardar la configuracion" },
      { status: 500 }
    );
  }
}
