"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Package,
  Users,
  Building2,
  Calendar,
  FileDown,
  Eye,
  Edit,
  MoreVertical,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFetch } from "@/lib/hooks/use-fetch";
import { downloadCsv } from "@/lib/csv";
import { APP_COMMAND_EVENT, consumePendingAppCommand } from "@/lib/command-bus";
import toast from "react-hot-toast";

interface Assignment {
  id: string;
  type: "PERSONAL" | "DEPARTAMENTAL";
  status: "ACTIVE" | "RETURNED" | "TRANSFERRED";
  assignedAt: string;
  returnedAt: string | null;
  notes: string | null;
  asset: {
    id: string;
    name: string;
    category: {
      name: string;
    };
  };
  user: {
    id: string;
    name: string;
    lastName: string;
  } | null;
  department: {
    id: string;
    name: string;
  } | null;
}

interface AssetOption {
  id: string;
  name: string;
  qrCode: string | null;
  status: string;
  hasActiveAssignment?: boolean;
}

interface UserOption {
  id: string;
  name: string;
  lastName: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

const statusColors: Record<
  Assignment["status"],
  { label: string; variant: "success" | "warning" | "secondary"; icon: LucideIcon }
> = {
  ACTIVE: { label: "Activo", variant: "success", icon: CheckCircle },
  RETURNED: { label: "Devuelto", variant: "secondary", icon: XCircle },
  TRANSFERRED: { label: "Transferido", variant: "warning", icon: ArrowLeftRight },
};

export default function AsignacionesPage() {
  const FILTERS_STORAGE_KEY = "asignaciones.filters.v1";

  const {
    data: assignments,
    loading,
    refetch,
  } = useFetch<Assignment[]>("/api/asignaciones", []);
  const { data: assets } = useFetch<AssetOption[]>("/api/activos?view=options", []);
  const { data: users } = useFetch<UserOption[]>("/api/usuarios?view=options", []);
  const { data: departments } = useFetch<DepartmentOption[]>("/api/departamentos?view=options", []);

  const [searchQuery, setSearchQuery] = React.useState("");
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = React.useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [selectedAssignment, setSelectedAssignment] = React.useState<Assignment | null>(null);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = React.useState<string[]>([]);
  const [editData, setEditData] = React.useState({
    type: "PERSONAL" as "PERSONAL" | "DEPARTAMENTAL",
    status: "ACTIVE" as "ACTIVE" | "RETURNED" | "TRANSFERRED",
    userId: "",
    departmentId: "",
    notes: "",
  });
  const [transferData, setTransferData] = React.useState({
    type: "PERSONAL" as "PERSONAL" | "DEPARTAMENTAL",
    userId: "",
    departmentId: "",
  });
  const [formData, setFormData] = React.useState({
    type: "PERSONAL" as "PERSONAL" | "DEPARTAMENTAL",
    assetId: "",
    userId: "",
    departmentId: "",
    notes: "",
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 18;

  const availableAssets = assets.filter(
    (asset) =>
      !asset.hasActiveAssignment &&
      asset.status !== "RETIRED" &&
      asset.status !== "MAINTENANCE"
  );

  const [filtersHydrated, setFiltersHydrated] = React.useState(false);

  React.useEffect(() => {
    if (filtersHydrated) {
      return;
    }

    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          searchQuery?: string;
          statusFilter?: string;
          typeFilter?: string;
        };

        if (typeof parsed.searchQuery === "string") {
          setSearchQuery(parsed.searchQuery);
        }
        if (typeof parsed.statusFilter === "string") {
          setStatusFilter(parsed.statusFilter);
        }
        if (typeof parsed.typeFilter === "string") {
          setTypeFilter(parsed.typeFilter);
        }
      }
    } catch {
      // noop
    } finally {
      setFiltersHydrated(true);
    }
  }, [filtersHydrated]);

  React.useEffect(() => {
    if (!filtersHydrated) {
      return;
    }

    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({ searchQuery, statusFilter, typeFilter })
    );
  }, [filtersHydrated, searchQuery, statusFilter, typeFilter]);

  const filteredAssignments = React.useMemo(() => {
    const searchText = deferredSearchQuery.toLowerCase();

    return assignments.filter((assignment) => {
      const userName = assignment.user
        ? `${assignment.user.name} ${assignment.user.lastName}`.toLowerCase()
        : "";

      const matchesSearch =
        assignment.asset.name.toLowerCase().includes(searchText) ||
        assignment.asset.id.toLowerCase().includes(searchText) ||
        assignment.department?.name.toLowerCase().includes(searchText) ||
        userName.includes(searchText);

      const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
      const matchesType = typeFilter === "all" || assignment.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [assignments, deferredSearchQuery, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE));

  const paginatedAssignments = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssignments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssignments, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, statusFilter, typeFilter]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const shouldStaggerAssignmentCards = paginatedAssignments.length <= 14;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const resetForm = React.useCallback(() => {
    setFormData({
      type: "PERSONAL",
      assetId: "",
      userId: "",
      departmentId: "",
      notes: "",
    });
  }, []);

  const handleCreateAssignment = async () => {
    if (!formData.assetId) {
      toast.error("Selecciona un activo");
      return;
    }

    if (formData.type === "PERSONAL" && !formData.userId) {
      toast.error("Selecciona un usuario");
      return;
    }

    if (formData.type === "DEPARTAMENTAL" && !formData.departmentId) {
      toast.error("Selecciona un departamento");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        assetId: formData.assetId,
        userId: formData.type === "PERSONAL" ? formData.userId : undefined,
        departmentId:
          formData.type === "DEPARTAMENTAL" ? formData.departmentId : undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch("/api/asignaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible crear la asignacion");
        return;
      }

      toast.success("Asignacion creada correctamente");
      setDialogOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("No fue posible crear la asignacion");
    } finally {
      setSubmitting(false);
    }
  };

  const openReturnDialog = (assignment: Assignment) => {
    if (assignment.status !== "ACTIVE") {
      toast.error("Solo se pueden devolver asignaciones activas");
      return;
    }

    setSelectedAssignment(assignment);
    setReturnDialogOpen(true);
  };

  const handleReturnAssignment = async () => {
    if (!selectedAssignment) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/asignaciones/${selectedAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RETURNED" }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible devolver la asignacion");
        return;
      }

      toast.success("Asignacion devuelta correctamente");
      setReturnDialogOpen(false);
      setSelectedAssignment(null);
      refetch();
    } catch {
      toast.error("No fue posible devolver la asignacion");
    } finally {
      setActionLoading(false);
    }
  };

  const openTransferDialog = (assignment: Assignment) => {
    if (assignment.status !== "ACTIVE") {
      toast.error("Solo se pueden transferir asignaciones activas");
      return;
    }

    setSelectedAssignment(assignment);
    setTransferData({
      type: assignment.type,
      userId: assignment.user?.id || "",
      departmentId: assignment.department?.id || "",
    });
    setTransferDialogOpen(true);
  };

  const openEditDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditData({
      type: assignment.type,
      status: assignment.status,
      userId: assignment.user?.id || "",
      departmentId: assignment.department?.id || "",
      notes: assignment.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditAssignment = async () => {
    if (!selectedAssignment) {
      return;
    }

    if (editData.type === "PERSONAL" && !editData.userId) {
      toast.error("Selecciona un usuario");
      return;
    }

    if (editData.type === "DEPARTAMENTAL" && !editData.departmentId) {
      toast.error("Selecciona un departamento");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/asignaciones/${selectedAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editData.type,
          status: editData.status,
          userId: editData.type === "PERSONAL" ? editData.userId : null,
          departmentId: editData.type === "DEPARTAMENTAL" ? editData.departmentId : null,
          notes: editData.notes || null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible actualizar la asignacion");
        return;
      }

      toast.success("Asignacion actualizada");
      setEditDialogOpen(false);
      setSelectedAssignment(null);
      refetch();
    } catch {
      toast.error("No fue posible actualizar la asignacion");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferAssignment = async () => {
    if (!selectedAssignment) {
      return;
    }

    if (transferData.type === "PERSONAL" && !transferData.userId) {
      toast.error("Selecciona un usuario destino");
      return;
    }

    if (transferData.type === "DEPARTAMENTAL" && !transferData.departmentId) {
      toast.error("Selecciona un departamento destino");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/asignaciones/${selectedAssignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "TRANSFERRED",
          type: transferData.type,
          userId: transferData.type === "PERSONAL" ? transferData.userId : null,
          departmentId:
            transferData.type === "DEPARTAMENTAL" ? transferData.departmentId : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible transferir");
        return;
      }

      toast.success("Asignacion transferida");
      setTransferDialogOpen(false);
      setSelectedAssignment(null);
      refetch();
    } catch {
      toast.error("No fue posible transferir");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectedAssignment = (assignmentId: string) => {
    setSelectedAssignmentIds((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const allFilteredSelected =
    paginatedAssignments.length > 0 &&
    paginatedAssignments.every((assignment) => selectedAssignmentIds.includes(assignment.id));

  const toggleAllFilteredAssignments = () => {
    const visibleIds = paginatedAssignments.map((assignment) => assignment.id);
    if (allFilteredSelected) {
      setSelectedAssignmentIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedAssignmentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleBulkStatusUpdate = async (status: "ACTIVE" | "RETURNED") => {
    if (selectedAssignmentIds.length === 0) {
      return;
    }

    try {
      setBulkLoading(true);
      const results = await Promise.all(
        selectedAssignmentIds.map(async (assignmentId) => {
          const response = await fetch(`/api/asignaciones/${assignmentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          return response.ok;
        })
      );

      const successCount = results.filter(Boolean).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} asignaciones actualizadas`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} asignaciones no pudieron actualizarse`);
      }

      refetch();
    } catch {
      toast.error("No fue posible actualizar asignaciones seleccionadas");
    } finally {
      setBulkLoading(false);
    }
  };

  const openBulkDeleteDialog = () => {
    if (selectedAssignmentIds.length === 0) {
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedAssignmentIds.length === 0) {
      return;
    }

    try {
      setBulkLoading(true);
      const results = await Promise.all(
        selectedAssignmentIds.map(async (assignmentId) => {
          const response = await fetch(`/api/asignaciones/${assignmentId}`, {
            method: "DELETE",
          });
          return response.ok;
        })
      );

      const successCount = results.filter(Boolean).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} asignaciones eliminadas`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} asignaciones no pudieron eliminarse`);
      }

      setSelectedAssignmentIds([]);
      setBulkDeleteDialogOpen(false);
      refetch();
    } catch {
      toast.error("No fue posible eliminar asignaciones seleccionadas");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      filteredAssignments,
      [
        { key: "id", header: "ID" },
        { key: "type", header: "Tipo" },
        { key: "status", header: "Estado" },
        { key: "asset", header: "Activo", map: (a) => a.asset.name },
        {
          key: "destino",
          header: "Destino",
          map: (a) =>
            a.user
              ? `${a.user.name} ${a.user.lastName}`
              : a.department?.name || "Sin destino",
        },
        { key: "assignedAt", header: "Fecha Asignacion" },
        { key: "notes", header: "Notas", map: (a) => a.notes || "" },
      ],
      `asignaciones-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success("CSV exportado correctamente");
  };

  const executeQuickCommand = React.useCallback(
    (command: string) => {
      if (command === "new-assignment") {
        resetForm();
        setDialogOpen(true);
      }
    },
    [resetForm]
  );

  React.useEffect(() => {
    const onCommand = (event: Event) => {
      const detail = (event as CustomEvent<{ command?: string }>).detail;
      if (!detail?.command) {
        return;
      }

      executeQuickCommand(detail.command);
    };

    window.addEventListener(APP_COMMAND_EVENT, onCommand as EventListener);

    const pendingCommand = consumePendingAppCommand();
    if (pendingCommand) {
      executeQuickCommand(pendingCommand);
    }

    return () => {
      window.removeEventListener(APP_COMMAND_EVENT, onCommand as EventListener);
    };
  }, [executeQuickCommand]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        toggleAllFilteredAssignments();
      }

      if (key === "e") {
        event.preventDefault();
        handleExportCsv();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAssignments, paginatedAssignments, selectedAssignmentIds]);

  if (loading) {
    return <Loading text="Cargando asignaciones..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <DashboardPageHeader
        eyebrow="Operacion"
        title="Asignaciones"
        description="Gestiona las asignaciones de activos a usuarios y departamentos"
        actions={
          <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Asignacion
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Asignacion</DialogTitle>
              <DialogDescription>
                Asigna un activo a un usuario o departamento
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de asignacion *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "PERSONAL" | "DEPARTAMENTAL") =>
                    setFormData((prev) => ({
                      ...prev,
                      type: value,
                      userId: "",
                      departmentId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal (a un usuario)</SelectItem>
                    <SelectItem value="DEPARTAMENTAL">Departamental (a un area)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Activo *</Label>
                <Select
                  value={formData.assetId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, assetId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar activo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssets.length > 0 ? (
                      availableAssets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({asset.qrCode || asset.id})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-assets" disabled>
                        No hay activos disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "PERSONAL" ? (
                <div className="space-y-2">
                  <Label>Usuario *</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, userId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Departamento *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, departmentId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones sobre la asignacion..."
                  rows={2}
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAssignment} disabled={submitting}>
                {submitting ? "Asignando..." : "Asignar"}
              </Button>
            </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por activo, usuario o departamento..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ACTIVE">Activos</SelectItem>
                <SelectItem value="RETURNED">Devueltos</SelectItem>
                <SelectItem value="TRANSFERRED">Transferidos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PERSONAL">Personal</SelectItem>
                <SelectItem value="DEPARTAMENTAL">Departamental</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={toggleAllFilteredAssignments}>
              {allFilteredSelected ? "Quitar visibles" : "Seleccionar visibles"}
            </Button>
          </div>
        </div>
      </div>

      {selectedAssignmentIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 px-3.5 py-2.5 text-sm shadow-[0_24px_40px_-30px_rgba(0,0,0,0.9)] backdrop-blur md:left-auto md:right-6 md:max-w-fit">
          <span className="font-medium tracking-[0.01em]">{selectedAssignmentIds.length} seleccionadas</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkStatusUpdate("ACTIVE")}
            disabled={bulkLoading}
          >
            Marcar activas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkStatusUpdate("RETURNED")}
            disabled={bulkLoading}
          >
            Marcar devueltas
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedAssignmentIds([])}>
            Limpiar
          </Button>
          <Button variant="destructive" size="sm" onClick={openBulkDeleteDialog} disabled={bulkLoading}>
            Eliminar
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Sin asignaciones"
            description="No hay resultados con los filtros actuales. Puedes crear una nueva asignacion."
            actionLabel="Nueva asignacion"
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          paginatedAssignments.map((assignment, index) => {
            const StatusIcon = statusColors[assignment.status].icon;
            return (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldStaggerAssignmentCards ? Math.min(index, 10) * 0.02 : 0 }}
            >
              <Card className="group border-border transition-all duration-200 ease-in-out">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="shrink-0 rounded-xl border border-border bg-secondary p-3">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{assignment.asset.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {assignment.asset.id}
                          </Badge>
                          <Badge variant={statusColors[assignment.status].variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusColors[assignment.status].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          {assignment.user && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {assignment.user.name} {assignment.user.lastName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {assignment.department?.name || "Sin departamento"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(assignment.assignedAt)}
                          </span>
                        </div>
                        {assignment.notes && (
                          <p className="text-xs text-muted-foreground mt-1">📝 {assignment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedAssignmentIds.includes(assignment.id)}
                        onChange={() => toggleSelectedAssignment(assignment.id)}
                        className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/40"
                      />
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(assignment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openTransferDialog(assignment)}
                            disabled={assignment.status !== "ACTIVE"}
                          >
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            Transferir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openReturnDialog(assignment)}
                            disabled={assignment.status !== "ACTIVE"}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Devolver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            );
          })
        )}
      </div>

      {filteredAssignments.length > ITEMS_PER_PAGE ? (
        <div className="ml-auto flex w-fit items-center gap-2 rounded-lg border border-border bg-card p-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Pagina anterior</span>
          </Button>
          <span className="min-w-[160px] text-center text-sm text-muted-foreground">
            Pagina {currentPage} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Pagina siguiente</span>
          </Button>
        </div>
      ) : null}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar asignacion</DialogTitle>
            <DialogDescription>
              Actualiza tipo, estado, destinatario y notas de la asignacion.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={editData.type}
                onValueChange={(value: "PERSONAL" | "DEPARTAMENTAL") =>
                  setEditData((prev) => ({
                    ...prev,
                    type: value,
                    userId: "",
                    departmentId: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="DEPARTAMENTAL">Departamental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={editData.status}
                onValueChange={(value: "ACTIVE" | "RETURNED" | "TRANSFERRED") =>
                  setEditData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="TRANSFERRED" disabled>
                      Transferido (usa la accion Transferir)
                    </SelectItem>
                    <SelectItem value="RETURNED">Devuelto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            {editData.type === "PERSONAL" ? (
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Select
                  value={editData.userId}
                  onValueChange={(value) =>
                    setEditData((prev) => ({ ...prev, userId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={editData.departmentId}
                  onValueChange={(value) =>
                    setEditData((prev) => ({ ...prev, departmentId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                rows={2}
                value={editData.notes}
                onChange={(event) =>
                  setEditData((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditAssignment} disabled={actionLoading}>
              {actionLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transferir asignacion</DialogTitle>
            <DialogDescription>
              Cambia el destino de la asignacion para {selectedAssignment?.asset.name || "el activo"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tipo destino</Label>
              <Select
                value={transferData.type}
                onValueChange={(value: "PERSONAL" | "DEPARTAMENTAL") =>
                  setTransferData((prev) => ({
                    ...prev,
                    type: value,
                    userId: "",
                    departmentId: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="DEPARTAMENTAL">Departamental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transferData.type === "PERSONAL" ? (
              <div className="space-y-2">
                <Label>Usuario destino</Label>
                <Select
                  value={transferData.userId}
                  onValueChange={(value) =>
                    setTransferData((prev) => ({ ...prev, userId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Departamento destino</Label>
                <Select
                  value={transferData.departmentId}
                  onValueChange={(value) =>
                    setTransferData((prev) => ({ ...prev, departmentId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTransferAssignment} disabled={actionLoading}>
              {actionLoading ? "Transfiriendo..." : "Transferir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        title="Devolver asignacion"
        description={`Se marcara como devuelta la asignacion de ${selectedAssignment?.asset.name || "este activo"}.`}
        confirmLabel="Devolver"
        onConfirm={handleReturnAssignment}
        loading={actionLoading}
      />

      <ConfirmActionDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Eliminar asignaciones seleccionadas"
        description={`Se eliminaran ${selectedAssignmentIds.length} asignaciones seleccionadas. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar seleccionadas"
        onConfirm={handleBulkDelete}
        loading={bulkLoading}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-secondary p-3">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter((assignment) => assignment.status === "ACTIVE").length}
                </p>
                <p className="text-sm text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-secondary p-3">
                <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter((assignment) => assignment.type === "PERSONAL").length}
                </p>
                <p className="text-sm text-muted-foreground">Personales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-secondary p-3">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter((assignment) => assignment.type === "DEPARTAMENTAL").length}
                </p>
                <p className="text-sm text-muted-foreground">Departamentales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-secondary p-3">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter((assignment) => assignment.status === "RETURNED").length}
                </p>
                <p className="text-sm text-muted-foreground">Devueltas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
