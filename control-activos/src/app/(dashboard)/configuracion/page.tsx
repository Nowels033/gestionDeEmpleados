"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  FileSpreadsheet,
  FolderArchive,
  Globe2,
  Hash,
  LockKeyhole,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import { SafeSelect } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";

interface GeneralSettings {
  organizationName: string;
  legalName: string;
  primaryLocation: string;
  timezone: string;
  locale: string;
  currency: string;
  dateFormat: string;
  qrPrefix: string;
  employeePrefix: string;
  sequenceStart: string;
}

interface SecuritySettings {
  sessionTimeoutMinutes: string;
  passwordMinLength: string;
  maxFailedLoginAttempts: string;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  reauthDelete: boolean;
  reauthImport: boolean;
  reauthRoleChanges: boolean;
}

interface FileSettings {
  maxImageMb: string;
  maxDocumentMb: string;
  allowedImageExtensions: string;
  allowedDocumentExtensions: string;
  retentionDays: string;
  deleteOrphansAfterDays: string;
  physicalDeleteEnabled: boolean;
}

type DuplicatePolicy = "REJECT" | "SKIP" | "UPDATE";

interface ImportSettings {
  maxRowsPerImport: string;
  duplicateSerialPolicy: DuplicatePolicy;
  duplicateQrPolicy: DuplicatePolicy;
  requiredColumns: string;
  allowPartialImport: boolean;
  strictEmailValidation: boolean;
}

interface AppSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  files: FileSettings;
  import: ImportSettings;
}

const APP_SETTINGS_STORAGE_KEY = "configuracion.app.v2";
const LEGACY_GENERAL_SETTINGS_STORAGE_KEY = "configuracion.general.v1";

const defaultGeneralSettings: GeneralSettings = {
  organizationName: "AssetOne",
  legalName: "AssetOne Solutions S.L.",
  primaryLocation: "Madrid, ES",
  timezone: "Europe/Madrid",
  locale: "es-ES",
  currency: "EUR",
  dateFormat: "DD/MM/YYYY",
  qrPrefix: "AST",
  employeePrefix: "EMP",
  sequenceStart: "1",
};

const defaultSecuritySettings: SecuritySettings = {
  sessionTimeoutMinutes: "480",
  passwordMinLength: "10",
  maxFailedLoginAttempts: "5",
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true,
  reauthDelete: true,
  reauthImport: true,
  reauthRoleChanges: true,
};

const defaultFileSettings: FileSettings = {
  maxImageMb: "10",
  maxDocumentMb: "15",
  allowedImageExtensions: ".jpg, .jpeg, .png, .webp",
  allowedDocumentExtensions: ".pdf, .jpg, .jpeg, .png, .webp, .doc, .docx, .xls, .xlsx, .csv",
  retentionDays: "3650",
  deleteOrphansAfterDays: "30",
  physicalDeleteEnabled: false,
};

const defaultImportSettings: ImportSettings = {
  maxRowsPerImport: "1000",
  duplicateSerialPolicy: "REJECT",
  duplicateQrPolicy: "REJECT",
  requiredColumns: "nombre, categoria, responsable_email",
  allowPartialImport: false,
  strictEmailValidation: true,
};

const defaultAppSettings: AppSettings = {
  general: defaultGeneralSettings,
  security: defaultSecuritySettings,
  files: defaultFileSettings,
  import: defaultImportSettings,
};

const timezoneOptions = [
  { value: "Europe/Madrid", label: "Europe/Madrid" },
  { value: "Europe/Mexico_City", label: "Europe/Mexico_City" },
  { value: "America/Bogota", label: "America/Bogota" },
  { value: "America/Argentina/Buenos_Aires", label: "America/Argentina/Buenos_Aires" },
  { value: "UTC", label: "UTC" },
];

const localeOptions = [
  { value: "es-ES", label: "Espanol (Espana)" },
  { value: "es-MX", label: "Espanol (Mexico)" },
  { value: "es-CO", label: "Espanol (Colombia)" },
  { value: "en-US", label: "English (US)" },
];

const currencyOptions = [
  { value: "EUR", label: "EUR - Euro" },
  { value: "MXN", label: "MXN - Peso mexicano" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "COP", label: "COP - Peso colombiano" },
];

const dateFormatOptions = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const duplicatePolicyOptions = [
  { value: "REJECT", label: "Rechazar duplicados" },
  { value: "SKIP", label: "Saltar duplicados" },
  { value: "UPDATE", label: "Actualizar existentes" },
];

function sanitizePrefix(prefix: string): string {
  return prefix
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 8);
}

function parsePositiveInteger(
  value: string,
  min: number,
  max: number
): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const integer = Math.floor(parsed);
  if (integer < min || integer > max) {
    return null;
  }

  return integer;
}

function normalizeExtensions(value: string): string {
  const unique = Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .map((item) => (item.startsWith(".") ? item : `.${item}`))
    )
  );

  return unique.join(", ");
}

function parseExtensionList(value: string): string[] {
  return normalizeExtensions(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeColumns(value: string): string {
  const unique = Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .map((item) => item.replace(/\s+/g, "_"))
    )
  );

  return unique.join(", ");
}

function parseColumnList(value: string): string[] {
  return normalizeColumns(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mergeGeneralSettings(raw: unknown): GeneralSettings {
  if (!isRecord(raw)) {
    return defaultGeneralSettings;
  }

  return {
    organizationName:
      typeof raw.organizationName === "string" && raw.organizationName.trim()
        ? raw.organizationName.trim()
        : defaultGeneralSettings.organizationName,
    legalName:
      typeof raw.legalName === "string" && raw.legalName.trim()
        ? raw.legalName.trim()
        : defaultGeneralSettings.legalName,
    primaryLocation:
      typeof raw.primaryLocation === "string" && raw.primaryLocation.trim()
        ? raw.primaryLocation.trim()
        : defaultGeneralSettings.primaryLocation,
    timezone:
      typeof raw.timezone === "string" && raw.timezone
        ? raw.timezone
        : defaultGeneralSettings.timezone,
    locale:
      typeof raw.locale === "string" && raw.locale
        ? raw.locale
        : defaultGeneralSettings.locale,
    currency:
      typeof raw.currency === "string" && raw.currency
        ? raw.currency
        : defaultGeneralSettings.currency,
    dateFormat:
      typeof raw.dateFormat === "string" && raw.dateFormat
        ? raw.dateFormat
        : defaultGeneralSettings.dateFormat,
    qrPrefix: sanitizePrefix(
      typeof raw.qrPrefix === "string" && raw.qrPrefix
        ? raw.qrPrefix
        : defaultGeneralSettings.qrPrefix
    ),
    employeePrefix: sanitizePrefix(
      typeof raw.employeePrefix === "string" && raw.employeePrefix
        ? raw.employeePrefix
        : defaultGeneralSettings.employeePrefix
    ),
    sequenceStart:
      typeof raw.sequenceStart === "string" && raw.sequenceStart.trim()
        ? raw.sequenceStart.trim()
        : defaultGeneralSettings.sequenceStart,
  };
}

function mergeSecuritySettings(raw: unknown): SecuritySettings {
  if (!isRecord(raw)) {
    return defaultSecuritySettings;
  }

  return {
    sessionTimeoutMinutes:
      typeof raw.sessionTimeoutMinutes === "string" && raw.sessionTimeoutMinutes.trim()
        ? raw.sessionTimeoutMinutes.trim()
        : defaultSecuritySettings.sessionTimeoutMinutes,
    passwordMinLength:
      typeof raw.passwordMinLength === "string" && raw.passwordMinLength.trim()
        ? raw.passwordMinLength.trim()
        : defaultSecuritySettings.passwordMinLength,
    maxFailedLoginAttempts:
      typeof raw.maxFailedLoginAttempts === "string" && raw.maxFailedLoginAttempts.trim()
        ? raw.maxFailedLoginAttempts.trim()
        : defaultSecuritySettings.maxFailedLoginAttempts,
    requireUppercase:
      typeof raw.requireUppercase === "boolean"
        ? raw.requireUppercase
        : defaultSecuritySettings.requireUppercase,
    requireNumber:
      typeof raw.requireNumber === "boolean"
        ? raw.requireNumber
        : defaultSecuritySettings.requireNumber,
    requireSpecial:
      typeof raw.requireSpecial === "boolean"
        ? raw.requireSpecial
        : defaultSecuritySettings.requireSpecial,
    reauthDelete:
      typeof raw.reauthDelete === "boolean"
        ? raw.reauthDelete
        : defaultSecuritySettings.reauthDelete,
    reauthImport:
      typeof raw.reauthImport === "boolean"
        ? raw.reauthImport
        : defaultSecuritySettings.reauthImport,
    reauthRoleChanges:
      typeof raw.reauthRoleChanges === "boolean"
        ? raw.reauthRoleChanges
        : defaultSecuritySettings.reauthRoleChanges,
  };
}

function mergeFileSettings(raw: unknown): FileSettings {
  if (!isRecord(raw)) {
    return defaultFileSettings;
  }

  return {
    maxImageMb:
      typeof raw.maxImageMb === "string" && raw.maxImageMb.trim()
        ? raw.maxImageMb.trim()
        : defaultFileSettings.maxImageMb,
    maxDocumentMb:
      typeof raw.maxDocumentMb === "string" && raw.maxDocumentMb.trim()
        ? raw.maxDocumentMb.trim()
        : defaultFileSettings.maxDocumentMb,
    allowedImageExtensions:
      typeof raw.allowedImageExtensions === "string" && raw.allowedImageExtensions.trim()
        ? raw.allowedImageExtensions.trim()
        : defaultFileSettings.allowedImageExtensions,
    allowedDocumentExtensions:
      typeof raw.allowedDocumentExtensions === "string" && raw.allowedDocumentExtensions.trim()
        ? raw.allowedDocumentExtensions.trim()
        : defaultFileSettings.allowedDocumentExtensions,
    retentionDays:
      typeof raw.retentionDays === "string" && raw.retentionDays.trim()
        ? raw.retentionDays.trim()
        : defaultFileSettings.retentionDays,
    deleteOrphansAfterDays:
      typeof raw.deleteOrphansAfterDays === "string" && raw.deleteOrphansAfterDays.trim()
        ? raw.deleteOrphansAfterDays.trim()
        : defaultFileSettings.deleteOrphansAfterDays,
    physicalDeleteEnabled:
      typeof raw.physicalDeleteEnabled === "boolean"
        ? raw.physicalDeleteEnabled
        : defaultFileSettings.physicalDeleteEnabled,
  };
}

function mergeImportSettings(raw: unknown): ImportSettings {
  if (!isRecord(raw)) {
    return defaultImportSettings;
  }

  const serialPolicy =
    raw.duplicateSerialPolicy === "REJECT" ||
    raw.duplicateSerialPolicy === "SKIP" ||
    raw.duplicateSerialPolicy === "UPDATE"
      ? raw.duplicateSerialPolicy
      : defaultImportSettings.duplicateSerialPolicy;

  const qrPolicy =
    raw.duplicateQrPolicy === "REJECT" ||
    raw.duplicateQrPolicy === "SKIP" ||
    raw.duplicateQrPolicy === "UPDATE"
      ? raw.duplicateQrPolicy
      : defaultImportSettings.duplicateQrPolicy;

  return {
    maxRowsPerImport:
      typeof raw.maxRowsPerImport === "string" && raw.maxRowsPerImport.trim()
        ? raw.maxRowsPerImport.trim()
        : defaultImportSettings.maxRowsPerImport,
    duplicateSerialPolicy: serialPolicy,
    duplicateQrPolicy: qrPolicy,
    requiredColumns:
      typeof raw.requiredColumns === "string" && raw.requiredColumns.trim()
        ? raw.requiredColumns.trim()
        : defaultImportSettings.requiredColumns,
    allowPartialImport:
      typeof raw.allowPartialImport === "boolean"
        ? raw.allowPartialImport
        : defaultImportSettings.allowPartialImport,
    strictEmailValidation:
      typeof raw.strictEmailValidation === "boolean"
        ? raw.strictEmailValidation
        : defaultImportSettings.strictEmailValidation,
  };
}

function mergeAppSettings(raw: unknown): AppSettings {
  if (!isRecord(raw)) {
    return defaultAppSettings;
  }

  return {
    general: mergeGeneralSettings(raw.general),
    security: mergeSecuritySettings(raw.security),
    files: mergeFileSettings(raw.files),
    import: mergeImportSettings(raw.import),
  };
}

export default function ConfiguracionPage() {
  const [hydrated, setHydrated] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("general");
  const [settings, setSettings] = React.useState<AppSettings>(defaultAppSettings);
  const [savedSnapshot, setSavedSnapshot] = React.useState<AppSettings>(defaultAppSettings);

  React.useEffect(() => {
    let cancelled = false;

    const hydrateSettings = async () => {
      let nextSettings: AppSettings | null = null;

      try {
        const response = await fetch("/api/configuracion", { cache: "no-store" });
        const body = await response.json().catch(() => null);

        if (
          response.ok &&
          isRecord(body) &&
          "settings" in body &&
          body.settings
        ) {
          nextSettings = mergeAppSettings(body.settings);
        }
      } catch {
        nextSettings = null;
      }

      if (!nextSettings) {
        try {
          const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);

          if (raw) {
            nextSettings = mergeAppSettings(JSON.parse(raw));
          } else {
            const legacyRaw = window.localStorage.getItem(LEGACY_GENERAL_SETTINGS_STORAGE_KEY);
            if (legacyRaw) {
              const legacyGeneral = mergeGeneralSettings(JSON.parse(legacyRaw));
              nextSettings = {
                ...defaultAppSettings,
                general: legacyGeneral,
              };
            }
          }
        } catch {
          nextSettings = null;
        }
      }

      const merged = nextSettings || defaultAppSettings;

      if (cancelled) {
        return;
      }

      setSettings(merged);
      setSavedSnapshot(merged);
      setHydrated(true);
    };

    void hydrateSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = React.useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
    [settings, savedSnapshot]
  );

  const nextSequence = React.useMemo(() => {
    return (
      parsePositiveInteger(settings.general.sequenceStart, 1, 99999999) ||
      parsePositiveInteger(defaultGeneralSettings.sequenceStart, 1, 99999999) ||
      1
    );
  }, [settings.general.sequenceStart]);

  const passwordStrengthScore = React.useMemo(() => {
    return [
      settings.security.requireUppercase,
      settings.security.requireNumber,
      settings.security.requireSpecial,
    ].filter(Boolean).length;
  }, [
    settings.security.requireUppercase,
    settings.security.requireNumber,
    settings.security.requireSpecial,
  ]);

  const passwordStrengthLabel =
    passwordStrengthScore === 3 ? "Alta" : passwordStrengthScore === 2 ? "Media" : "Basica";

  const imageExtensions = React.useMemo(
    () => parseExtensionList(settings.files.allowedImageExtensions),
    [settings.files.allowedImageExtensions]
  );

  const documentExtensions = React.useMemo(
    () => parseExtensionList(settings.files.allowedDocumentExtensions),
    [settings.files.allowedDocumentExtensions]
  );

  const requiredColumns = React.useMemo(
    () => parseColumnList(settings.import.requiredColumns),
    [settings.import.requiredColumns]
  );

  const handleSave = async () => {
    if (!settings.general.organizationName.trim()) {
      toast.error("El nombre de organizacion es obligatorio");
      return;
    }

    if (!settings.general.qrPrefix.trim() || !settings.general.employeePrefix.trim()) {
      toast.error("Los prefijos de codigos no pueden estar vacios");
      return;
    }

    const sequenceStart = parsePositiveInteger(settings.general.sequenceStart, 1, 99999999);
    if (!sequenceStart) {
      toast.error("El correlativo inicial debe estar entre 1 y 99999999");
      return;
    }

    const sessionTimeout = parsePositiveInteger(
      settings.security.sessionTimeoutMinutes,
      15,
      1440
    );
    if (!sessionTimeout) {
      toast.error("La sesion debe durar entre 15 y 1440 minutos");
      return;
    }

    const passwordMinLength = parsePositiveInteger(settings.security.passwordMinLength, 8, 64);
    if (!passwordMinLength) {
      toast.error("La longitud minima de password debe estar entre 8 y 64");
      return;
    }

    const maxAttempts = parsePositiveInteger(
      settings.security.maxFailedLoginAttempts,
      3,
      20
    );
    if (!maxAttempts) {
      toast.error("Los intentos fallidos permitidos deben estar entre 3 y 20");
      return;
    }

    const maxImageMb = parsePositiveInteger(settings.files.maxImageMb, 1, 50);
    const maxDocumentMb = parsePositiveInteger(settings.files.maxDocumentMb, 1, 100);
    const retentionDays = parsePositiveInteger(settings.files.retentionDays, 30, 36500);
    const orphanDays = parsePositiveInteger(settings.files.deleteOrphansAfterDays, 1, 365);

    if (!maxImageMb || !maxDocumentMb || !retentionDays || !orphanDays) {
      toast.error("Revisa los limites de archivos y retencion");
      return;
    }

    const normalizedImageExtensions = normalizeExtensions(settings.files.allowedImageExtensions);
    const normalizedDocumentExtensions = normalizeExtensions(
      settings.files.allowedDocumentExtensions
    );

    if (!normalizedImageExtensions || !normalizedDocumentExtensions) {
      toast.error("Las extensiones permitidas no pueden quedar vacias");
      return;
    }

    const maxRowsPerImport = parsePositiveInteger(settings.import.maxRowsPerImport, 1, 20000);
    if (!maxRowsPerImport) {
      toast.error("El limite de filas por importacion debe estar entre 1 y 20000");
      return;
    }

    const normalizedColumns = normalizeColumns(settings.import.requiredColumns);
    const normalizedColumnList = parseColumnList(normalizedColumns);
    const mandatoryColumns = ["nombre", "categoria", "responsable_email"];

    const missingMandatoryColumn = mandatoryColumns.find(
      (column) => !normalizedColumnList.includes(column)
    );

    if (!normalizedColumns || missingMandatoryColumn) {
      toast.error("Columnas obligatorias: nombre, categoria, responsable_email");
      return;
    }

    try {
      setSaving(true);

      const normalized: AppSettings = {
        general: {
          organizationName: settings.general.organizationName.trim(),
          legalName: settings.general.legalName.trim(),
          primaryLocation: settings.general.primaryLocation.trim(),
          timezone: settings.general.timezone,
          locale: settings.general.locale,
          currency: settings.general.currency,
          dateFormat: settings.general.dateFormat,
          qrPrefix: sanitizePrefix(settings.general.qrPrefix),
          employeePrefix: sanitizePrefix(settings.general.employeePrefix),
          sequenceStart: String(sequenceStart),
        },
        security: {
          sessionTimeoutMinutes: String(sessionTimeout),
          passwordMinLength: String(passwordMinLength),
          maxFailedLoginAttempts: String(maxAttempts),
          requireUppercase: settings.security.requireUppercase,
          requireNumber: settings.security.requireNumber,
          requireSpecial: settings.security.requireSpecial,
          reauthDelete: settings.security.reauthDelete,
          reauthImport: settings.security.reauthImport,
          reauthRoleChanges: settings.security.reauthRoleChanges,
        },
        files: {
          maxImageMb: String(maxImageMb),
          maxDocumentMb: String(maxDocumentMb),
          allowedImageExtensions: normalizedImageExtensions,
          allowedDocumentExtensions: normalizedDocumentExtensions,
          retentionDays: String(retentionDays),
          deleteOrphansAfterDays: String(orphanDays),
          physicalDeleteEnabled: settings.files.physicalDeleteEnabled,
        },
        import: {
          maxRowsPerImport: String(maxRowsPerImport),
          duplicateSerialPolicy: settings.import.duplicateSerialPolicy,
          duplicateQrPolicy: settings.import.duplicateQrPolicy,
          requiredColumns: normalizedColumns,
          allowPartialImport: settings.import.allowPartialImport,
          strictEmailValidation: settings.import.strictEmailValidation,
        },
      };

      const response = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: normalized }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "No fue posible guardar la configuracion en el servidor");
        return;
      }

      window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
      window.localStorage.setItem(
        LEGACY_GENERAL_SETTINGS_STORAGE_KEY,
        JSON.stringify(normalized.general)
      );

      setSettings(normalized);
      setSavedSnapshot(normalized);
      toast.success("Configuracion guardada");
    } catch {
      toast.error("No fue posible guardar la configuracion");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: defaultAppSettings }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "No fue posible restablecer la configuracion");
        return;
      }

      setSettings(defaultAppSettings);
      setSavedSnapshot(defaultAppSettings);
      window.localStorage.removeItem(APP_SETTINGS_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_GENERAL_SETTINGS_STORAGE_KEY);
      toast.success("Configuracion restablecida a valores por defecto");
    } catch {
      toast.error("No fue posible restablecer la configuracion");
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated) {
    return <Loading text="Cargando configuracion..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <DashboardPageHeader
        eyebrow="Ajustes"
        title="Configuracion"
        description="General, seguridad, archivos e importacion"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restablecer
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="files">Archivos</TabsTrigger>
          <TabsTrigger value="import">Importacion CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-border lg:col-span-2">
              <CardContent className="space-y-6 p-5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    General
                  </h2>
                  {isDirty ? <Badge variant="warning">Cambios sin guardar</Badge> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nombre de organizacion</Label>
                    <Input
                      value={settings.general.organizationName}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            organizationName: event.target.value,
                          },
                        }))
                      }
                      placeholder="Ej. AssetOne"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Razon social</Label>
                    <Input
                      value={settings.general.legalName}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            legalName: event.target.value,
                          },
                        }))
                      }
                      placeholder="Ej. AssetOne Solutions S.L."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Sede principal</Label>
                    <Input
                      value={settings.general.primaryLocation}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            primaryLocation: event.target.value,
                          },
                        }))
                      }
                      placeholder="Ej. Madrid, ES"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="inline-flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-muted-foreground" />
                      Zona horaria
                    </Label>
                    <SafeSelect
                      value={settings.general.timezone}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            timezone: value,
                          },
                        }))
                      }
                      items={timezoneOptions}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="inline-flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-muted-foreground" />
                      Idioma / locale
                    </Label>
                    <SafeSelect
                      value={settings.general.locale}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            locale: value,
                          },
                        }))
                      }
                      items={localeOptions}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <SafeSelect
                      value={settings.general.currency}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            currency: value,
                          },
                        }))
                      }
                      items={currencyOptions}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      Formato de fecha
                    </Label>
                    <SafeSelect
                      value={settings.general.dateFormat}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            dateFormat: value,
                          },
                        }))
                      }
                      items={dateFormatOptions}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="inline-flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      Prefijo QR
                    </Label>
                    <Input
                      value={settings.general.qrPrefix}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            qrPrefix: sanitizePrefix(event.target.value),
                          },
                        }))
                      }
                      placeholder="AST"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="inline-flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      Prefijo empleado
                    </Label>
                    <Input
                      value={settings.general.employeePrefix}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            employeePrefix: sanitizePrefix(event.target.value),
                          },
                        }))
                      }
                      placeholder="EMP"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Correlativo inicial</Label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.general.sequenceStart}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            sequenceStart: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Vista rapida
                </h3>

                <div className="space-y-2 rounded-lg border border-border bg-secondary/45 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Proximo codigo QR
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {settings.general.qrPrefix || "AST"}-{String(nextSequence).padStart(4, "0")}
                  </p>
                </div>

                <div className="space-y-2 rounded-lg border border-border bg-secondary/45 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Proximo numero empleado
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {settings.general.employeePrefix || "EMP"}-{String(nextSequence).padStart(4, "0")}
                  </p>
                </div>

                <div className="space-y-1 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Moneda:</span> {settings.general.currency}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Locale:</span> {settings.general.locale}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Zona horaria:</span> {settings.general.timezone}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Formato fecha:</span> {settings.general.dateFormat}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-border lg:col-span-2">
              <CardContent className="space-y-6 p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Seguridad
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Duracion de sesion (min)</Label>
                    <Input
                      type="number"
                      min={15}
                      max={1440}
                      value={settings.security.sessionTimeoutMinutes}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            sessionTimeoutMinutes: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Longitud minima de password</Label>
                    <Input
                      type="number"
                      min={8}
                      max={64}
                      value={settings.security.passwordMinLength}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            passwordMinLength: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Intentos fallidos permitidos</Label>
                    <Input
                      type="number"
                      min={3}
                      max={20}
                      value={settings.security.maxFailedLoginAttempts}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          security: {
                            ...prev.security,
                            maxFailedLoginAttempts: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Politica de password
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground">Requerir mayuscula</p>
                      <Switch
                        checked={settings.security.requireUppercase}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              requireUppercase: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground">Requerir numero</p>
                      <Switch
                        checked={settings.security.requireNumber}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              requireNumber: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground">Requerir simbolo especial</p>
                      <Switch
                        checked={settings.security.requireSpecial}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              requireSpecial: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Reautenticacion para acciones criticas
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground">Eliminar registros</p>
                      <Switch
                        checked={settings.security.reauthDelete}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              reauthDelete: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground">Importaciones masivas</p>
                      <Switch
                        checked={settings.security.reauthImport}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              reauthImport: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-foreground">Cambios de rol</p>
                      <Switch
                        checked={settings.security.reauthRoleChanges}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            security: {
                              ...prev.security,
                              reauthRoleChanges: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Perfil de seguridad
                </h3>

                <div className="space-y-2 rounded-lg border border-border bg-secondary/45 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Complejidad password
                  </p>
                  <Badge variant={passwordStrengthScore === 3 ? "success" : "warning"}>
                    {passwordStrengthLabel}
                  </Badge>
                </div>

                <div className="space-y-2 rounded-lg border border-border bg-secondary/45 p-3 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Sesion:</span>{" "}
                    {settings.security.sessionTimeoutMinutes} min
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Min password:</span>{" "}
                    {settings.security.passwordMinLength}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Max intentos:</span>{" "}
                    {settings.security.maxFailedLoginAttempts}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                  <p className="mb-1 font-medium text-foreground">Reautenticacion activa en:</p>
                  <ul className="space-y-1">
                    <li>{settings.security.reauthDelete ? "- Eliminaciones" : "- Eliminaciones: no"}</li>
                    <li>{settings.security.reauthImport ? "- Importaciones" : "- Importaciones: no"}</li>
                    <li>
                      {settings.security.reauthRoleChanges
                        ? "- Cambios de rol"
                        : "- Cambios de rol: no"}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-border lg:col-span-2">
              <CardContent className="space-y-6 p-5">
                <div className="flex items-center gap-2">
                  <FolderArchive className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Archivos y documentos
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Peso maximo imagen (MB)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={settings.files.maxImageMb}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          files: {
                            ...prev.files,
                            maxImageMb: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Peso maximo documento (MB)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={settings.files.maxDocumentMb}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          files: {
                            ...prev.files,
                            maxDocumentMb: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Extensiones de imagen permitidas (coma separada)</Label>
                    <Input
                      value={settings.files.allowedImageExtensions}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          files: {
                            ...prev.files,
                            allowedImageExtensions: event.target.value,
                          },
                        }))
                      }
                      placeholder=".jpg, .jpeg, .png, .webp"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Extensiones de documento permitidas (coma separada)</Label>
                    <Input
                      value={settings.files.allowedDocumentExtensions}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          files: {
                            ...prev.files,
                            allowedDocumentExtensions: event.target.value,
                          },
                        }))
                      }
                      placeholder=".pdf, .docx, .xlsx"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Retencion de archivos (dias)</Label>
                    <Input
                      type="number"
                      min={30}
                      max={36500}
                      value={settings.files.retentionDays}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          files: {
                            ...prev.files,
                            retentionDays: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Limpieza de huerfanos (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={settings.files.deleteOrphansAfterDays}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          files: {
                            ...prev.files,
                            deleteOrphansAfterDays: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Borrado fisico habilitado</p>
                      <p className="text-xs text-muted-foreground">
                        Si esta activo, al eliminar registro tambien se elimina el archivo del storage.
                      </p>
                    </div>
                    <Switch
                      checked={settings.files.physicalDeleteEnabled}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          files: {
                            ...prev.files,
                            physicalDeleteEnabled: checked,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Perfil de adjuntos
                </h3>

                <div className="space-y-2 rounded-lg border border-border bg-secondary/45 p-3 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Imagen:</span> {settings.files.maxImageMb} MB
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Documento:</span> {settings.files.maxDocumentMb} MB
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Retencion:</span> {settings.files.retentionDays} dias
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Extensiones imagen
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {imageExtensions.map((extension) => (
                      <Badge key={extension} variant="outline" className="text-[10px]">
                        {extension}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Extensiones documento
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {documentExtensions.map((extension) => (
                      <Badge key={extension} variant="outline" className="text-[10px]">
                        {extension}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="import">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-border lg:col-span-2">
              <CardContent className="space-y-6 p-5">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Importacion CSV
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Maximo de filas por importacion</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20000}
                      value={settings.import.maxRowsPerImport}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          import: {
                            ...prev.import,
                            maxRowsPerImport: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duplicados por serial</Label>
                    <SafeSelect
                      value={settings.import.duplicateSerialPolicy}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          import: {
                            ...prev.import,
                            duplicateSerialPolicy: value as DuplicatePolicy,
                          },
                        }))
                      }
                      items={duplicatePolicyOptions}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duplicados por codigo QR</Label>
                    <SafeSelect
                      value={settings.import.duplicateQrPolicy}
                      onValueChange={(value) =>
                        setSettings((prev) => ({
                          ...prev,
                          import: {
                            ...prev.import,
                            duplicateQrPolicy: value as DuplicatePolicy,
                          },
                        }))
                      }
                      items={duplicatePolicyOptions}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Columnas requeridas (coma separada)</Label>
                    <Input
                      value={settings.import.requiredColumns}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          import: {
                            ...prev.import,
                            requiredColumns: event.target.value,
                          },
                        }))
                      }
                      placeholder="nombre, categoria, responsable_email"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Permitir importacion parcial</p>
                        <p className="text-xs text-muted-foreground">
                          Si hay filas con error, se importan solo las validas.
                        </p>
                      </div>
                      <Switch
                        checked={settings.import.allowPartialImport}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            import: {
                              ...prev.import,
                              allowPartialImport: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Validar email estricto</p>
                        <p className="text-xs text-muted-foreground">
                          Rechaza filas con correo de responsable invalido.
                        </p>
                      </div>
                      <Switch
                        checked={settings.import.strictEmailValidation}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            import: {
                              ...prev.import,
                              strictEmailValidation: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="space-y-4 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Perfil de importacion
                </h3>

                <div className="space-y-2 rounded-lg border border-border bg-secondary/45 p-3 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Limite por carga:</span>{" "}
                    {settings.import.maxRowsPerImport} filas
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Serial:</span>{" "}
                    {settings.import.duplicateSerialPolicy}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">QR:</span>{" "}
                    {settings.import.duplicateQrPolicy}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Columnas obligatorias
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {requiredColumns.map((column) => (
                      <Badge key={column} variant="outline" className="text-[10px]">
                        {column}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                  <p className="mb-1 inline-flex items-center gap-1 font-medium text-foreground">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    Comportamiento actual
                  </p>
                  <ul className="space-y-1">
                    <li>
                      {settings.import.allowPartialImport
                        ? "- Importacion parcial habilitada"
                        : "- Importacion parcial deshabilitada"}
                    </li>
                    <li>
                      {settings.import.strictEmailValidation
                        ? "- Validacion de email estricta"
                        : "- Validacion de email flexible"}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
