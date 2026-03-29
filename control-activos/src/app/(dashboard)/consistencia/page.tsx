"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";

interface ConsistencyIssue {
  code: string;
  label: string;
  severity: "critical" | "warning";
  count: number;
  autoFixable: boolean;
  sampleIds: string[];
}

interface ConsistencyHealth {
  checkedAt: string;
  healthy: boolean;
  totalIssues: number;
  issues: ConsistencyIssue[];
}

interface SqlConstraintStatus {
  name: string;
  type: "index" | "check";
  description: string;
  exists: boolean;
}

interface ConsistencyResponse {
  health: ConsistencyHealth;
  constraints: SqlConstraintStatus[];
  canAutoFix: boolean;
}

const defaultResponse: ConsistencyResponse = {
  health: {
    checkedAt: new Date(0).toISOString(),
    healthy: true,
    totalIssues: 0,
    issues: [],
  },
  constraints: [],
  canAutoFix: false,
};

export default function ConsistenciaPage() {
  const { data, loading, error, refetch } = useFetch<ConsistencyResponse>(
    "/api/admin/consistencia",
    defaultResponse
  );

  const [autoFixDialogOpen, setAutoFixDialogOpen] = React.useState(false);
  const [constraintsDialogOpen, setConstraintsDialogOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  const criticalIssues = data.health.issues.filter((issue) => issue.severity === "critical");
  const warningIssues = data.health.issues.filter((issue) => issue.severity === "warning");
  const constraintsReady =
    data.constraints.length > 0 && data.constraints.every((constraint) => constraint.exists);

  const executeAction = async (payload: {
    autoFix?: boolean;
    applySqlConstraints?: boolean;
  }) => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/admin/consistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          confirmation: payload.autoFix ? "APLICAR_FIXES" : undefined,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(body?.error ?? "No fue posible completar la accion");
        return;
      }

      if (payload.autoFix && payload.applySqlConstraints) {
        toast.success("Auto-fix y constraints aplicados");
      } else if (payload.autoFix) {
        toast.success("Auto-fix aplicado");
      } else {
        toast.success("Constraints SQL aplicados");
      }

      refetch();
    } catch {
      toast.error("No fue posible completar la accion");
    } finally {
      setActionLoading(false);
      setAutoFixDialogOpen(false);
      setConstraintsDialogOpen(false);
    }
  };

  if (loading) {
    return <Loading text="Revisando consistencia..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No fue posible cargar la salud de consistencia"
        description="Verifica permisos de administrador o intenta nuevamente."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <DashboardPageHeader
        eyebrow="Admin"
        title="Salud de consistencia"
        description={
          data.health.healthy
            ? "No se detectaron inconsistencias"
            : `${data.health.totalIssues} inconsistencias detectadas`
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={refetch} disabled={actionLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recalcular
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoFixDialogOpen(true)}
              disabled={!data.canAutoFix || actionLoading}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Auto-fix controlado
            </Button>
            <Button
              size="sm"
              onClick={() => setConstraintsDialogOpen(true)}
              disabled={constraintsReady || actionLoading}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Aplicar constraints SQL
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Issues criticos
            </p>
            <p className="mt-1 text-2xl font-semibold text-rose-300">{criticalIssues.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Warnings</p>
            <p className="mt-1 text-2xl font-semibold text-amber-300">{warningIssues.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Ultima revision
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {formatDateTime(data.health.checkedAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Issues detectados
            </h2>
            {data.health.healthy ? (
              <Badge variant="success" className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Salud OK
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Requiere atencion
              </Badge>
            )}
          </div>

          {data.health.issues.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Sin inconsistencias"
              description="El sistema no presenta desajustes de datos en esta revision."
            />
          ) : (
            <div className="space-y-3">
              {data.health.issues.map((issue) => (
                <div
                  key={issue.code}
                  className="rounded-lg border border-border bg-secondary/45 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{issue.label}</p>
                      <p className="text-xs text-muted-foreground">Codigo: {issue.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={issue.severity === "critical" ? "destructive" : "warning"}>
                        {issue.severity === "critical" ? "Critico" : "Warning"}
                      </Badge>
                      <Badge variant="outline">{issue.count}</Badge>
                      {issue.autoFixable ? <Badge variant="info">Auto-fix</Badge> : null}
                    </div>
                  </div>
                  {issue.sampleIds.length > 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Ejemplos: {issue.sampleIds.join(", ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Constraints SQL
          </h2>
          <div className="space-y-3">
            {data.constraints.map((constraint) => (
              <div
                key={constraint.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/45 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{constraint.description}</p>
                  <p className="text-xs text-muted-foreground">{constraint.name}</p>
                </div>
                <Badge variant={constraint.exists ? "success" : "warning"}>
                  {constraint.exists ? "Activo" : "Pendiente"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={autoFixDialogOpen}
        onOpenChange={setAutoFixDialogOpen}
        title="Aplicar auto-fix de consistencia"
        description="Aplicara correcciones no destructivas sobre asignaciones, mantenimientos y estados de activos."
        confirmLabel="Aplicar auto-fix"
        loading={actionLoading}
        onConfirm={() => executeAction({ autoFix: true })}
      />

      <ConfirmActionDialog
        open={constraintsDialogOpen}
        onOpenChange={setConstraintsDialogOpen}
        title="Aplicar constraints SQL reales"
        description="Creara indice parcial y checks en base de datos para blindar reglas criticas."
        confirmLabel="Aplicar constraints"
        loading={actionLoading}
        onConfirm={() => executeAction({ applySqlConstraints: true })}
      />
    </motion.div>
  );
}
