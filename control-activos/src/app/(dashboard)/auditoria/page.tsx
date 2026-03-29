"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Activity, Filter, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SafeSelect } from "@/components/ui/select";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatDateTime } from "@/lib/utils";

interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  ipAddress: string | null;
  createdAt: string;
  oldValue: string | null;
  newValue: string | null;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
  asset: {
    id: string;
    name: string;
    qrCode: string | null;
  } | null;
}

interface AuditLogResponse {
  items: AuditLogItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filterOptions: {
    entities: string[];
    actions: string[];
    users: { id: string; name: string }[];
  };
}

const defaultAuditResponse: AuditLogResponse = {
  items: [],
  pagination: {
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  },
  filterOptions: {
    entities: [],
    actions: [],
    users: [],
  },
};

function toEntityLabel(entity: string): string {
  const labels: Record<string, string> = {
    asset: "Activo",
    user: "Usuario",
    assignment: "Asignacion",
    maintenance: "Mantenimiento",
    contract: "Contrato",
    category: "Categoria",
    department: "Departamento",
    asset_attachment: "Adjunto de activo",
    user_document: "Documento de usuario",
    file_upload: "Subida de archivo",
    asset_import: "Importacion CSV",
  };

  return labels[entity] || entity;
}

function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "DELETE") {
    return "destructive";
  }

  if (action === "CREATE" || action === "UPLOAD" || action === "BULK_IMPORT") {
    return "default";
  }

  if (action === "UPDATE" || action === "PATCH" || action === "SET_PRIMARY") {
    return "secondary";
  }

  return "outline";
}

export default function AuditoriaPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [entityFilter, setEntityFilter] = React.useState("all");
  const [actionFilter, setActionFilter] = React.useState("all");
  const [userFilter, setUserFilter] = React.useState("all");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const endpoint = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("pageSize", "25");

    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }

    if (entityFilter !== "all") {
      params.set("entity", entityFilter);
    }

    if (actionFilter !== "all") {
      params.set("action", actionFilter);
    }

    if (userFilter !== "all") {
      params.set("userId", userFilter);
    }

    if (fromDate) {
      params.set("from", fromDate);
    }

    if (toDate) {
      params.set("to", toDate);
    }

    return `/api/auditoria?${params.toString()}`;
  }, [searchQuery, entityFilter, actionFilter, userFilter, fromDate, toDate, currentPage]);

  const { data, loading } = useFetch<AuditLogResponse>(endpoint, defaultAuditResponse);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, entityFilter, actionFilter, userFilter, fromDate, toDate]);

  const entityOptions = [
    { value: "all", label: "Todas las entidades" },
    ...data.filterOptions.entities.map((entity) => ({
      value: entity,
      label: toEntityLabel(entity),
    })),
  ];

  const actionOptions = [
    { value: "all", label: "Todas las acciones" },
    ...data.filterOptions.actions.map((action) => ({
      value: action,
      label: action,
    })),
  ];

  const userOptions = [
    { value: "all", label: "Todos los usuarios" },
    ...data.filterOptions.users.map((user) => ({
      value: user.id,
      label: user.name,
    })),
  ];

  const resetFilters = () => {
    setSearchQuery("");
    setEntityFilter("all");
    setActionFilter("all");
    setUserFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  if (loading) {
    return <Loading text="Cargando bitacora..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <DashboardPageHeader
        eyebrow="Seguridad"
        title="Bitacora de auditoria"
        description={`${data.pagination.total} eventos registrados`}
      />

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[2fr_repeat(3,minmax(0,1fr))]">
          <Input
            placeholder="Buscar por descripcion, entidad o usuario"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <SafeSelect
            value={entityFilter}
            onValueChange={setEntityFilter}
            placeholder="Entidad"
            items={entityOptions}
          />
          <SafeSelect
            value={actionFilter}
            onValueChange={setActionFilter}
            placeholder="Accion"
            items={actionOptions}
          />
          <SafeSelect
            value={userFilter}
            onValueChange={setUserFilter}
            placeholder="Usuario"
            items={userOptions}
          />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
          <Button variant="outline" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            {data.pagination.total} resultados
          </div>
        </div>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Sin eventos para mostrar"
          description="Ajusta los filtros o vuelve mas tarde para revisar nuevos movimientos."
        />
      ) : (
        <Card className="overflow-hidden border-border">
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto scrollbar-thin">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-border bg-card/95 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Usuario</th>
                    <th className="px-4 py-3 text-left">Accion</th>
                    <th className="px-4 py-3 text-left">Entidad</th>
                    <th className="px-4 py-3 text-left">Descripcion</th>
                    <th className="px-4 py-3 text-left">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-b border-border/80 align-top text-sm">
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {item.user.name} {item.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getActionBadgeVariant(item.action)}>{item.action}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{toEntityLabel(item.entity)}</p>
                        <p className="font-mono text-xs text-muted-foreground">{item.entityId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground">{item.description}</p>
                        {item.asset ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Activo: {item.asset.name}
                            {item.asset.qrCode ? ` (${item.asset.qrCode})` : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.ipAddress || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {data.pagination.totalPages > 1 ? (
        <div className="ml-auto flex w-fit items-center gap-2 rounded-lg border border-border bg-card p-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={data.pagination.page <= 1}
          >
            Anterior
          </Button>
          <span className="min-w-[140px] text-center text-sm text-muted-foreground">
            Pagina {data.pagination.page} de {data.pagination.totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(data.pagination.totalPages, prev + 1))
            }
            disabled={data.pagination.page >= data.pagination.totalPages}
          >
            Siguiente
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}
