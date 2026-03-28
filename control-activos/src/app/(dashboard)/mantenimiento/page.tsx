"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  MoreVertical,
  Eye,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
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
import toast from "react-hot-toast";

interface MaintenanceLog {
  id: string;
  type: "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY";
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledDate: string;
  completedDate: string | null;
  cost: number | null;
  notes: string | null;
  asset: {
    id: string;
    name: string;
    qrCode: string | null;
  };
  technician: {
    id: string;
    name: string;
    lastName: string;
  } | null;
}

interface AssetOption {
  id: string;
  name: string;
  qrCode: string | null;
}

interface UserOption {
  id: string;
  name: string;
  lastName: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  PREVENTIVE: { label: "Preventivo", color: "text-blue-500" },
  CORRECTIVE: { label: "Correctivo", color: "text-amber-500" },
  EMERGENCY: { label: "Emergencia", color: "text-red-500" },
};

const statusColors: Record<
  string,
  { label: string; variant: "warning" | "info" | "success" | "secondary" }
> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  IN_PROGRESS: { label: "En progreso", variant: "info" },
  COMPLETED: { label: "Completado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "secondary" },
};

export default function MantenimientoPage() {
  const { data: maintenanceLogs, loading, refetch } = useFetch<MaintenanceLog[]>(
    "/api/mantenimientos",
    []
  );
  const { data: assets } = useFetch<AssetOption[]>("/api/activos", []);
  const { data: users } = useFetch<UserOption[]>("/api/usuarios", []);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [selectedLog, setSelectedLog] = React.useState<MaintenanceLog | null>(null);
  const [editFormData, setEditFormData] = React.useState({
    type: "PREVENTIVE" as "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY",
    status: "PENDING" as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
    description: "",
    scheduledDate: "",
    cost: "",
    technicianId: "none",
    notes: "",
  });
  const [formData, setFormData] = React.useState({
    assetId: "",
    type: "PREVENTIVE" as "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY",
    description: "",
    scheduledDate: "",
    cost: "",
    technicianId: "",
    notes: "",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleCreateMaintenance = async () => {
    if (!formData.assetId || !formData.description || !formData.scheduledDate) {
      toast.error("Completa los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/mantenimientos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: formData.assetId,
          type: formData.type,
          description: formData.description,
          scheduledDate: formData.scheduledDate,
          cost: formData.cost ? Number(formData.cost) : undefined,
          technicianId: formData.technicianId || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible crear el mantenimiento");
        return;
      }

      toast.success("Mantenimiento creado correctamente");
      setDialogOpen(false);
      setFormData({
        assetId: "",
        type: "PREVENTIVE",
        description: "",
        scheduledDate: "",
        cost: "",
        technicianId: "",
        notes: "",
      });
      refetch();
    } catch {
      toast.error("No fue posible crear el mantenimiento");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setEditFormData({
      type: log.type,
      status: log.status,
      description: log.description,
      scheduledDate: new Date(log.scheduledDate).toISOString().slice(0, 10),
      cost: log.cost?.toString() || "",
      technicianId: log.technician?.id || "none",
      notes: log.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditMaintenance = async () => {
    if (!selectedLog) {
      return;
    }

    if (!editFormData.description.trim() || !editFormData.scheduledDate) {
      toast.error("Descripcion y fecha programada son requeridas");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/mantenimientos/${selectedLog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editFormData.type,
          status: editFormData.status,
          description: editFormData.description.trim(),
          scheduledDate: editFormData.scheduledDate,
          cost: editFormData.cost ? Number(editFormData.cost) : null,
          technicianId: editFormData.technicianId === "none" ? null : editFormData.technicianId,
          notes: editFormData.notes || null,
          completedDate:
            editFormData.status === "COMPLETED" ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible actualizar");
        return;
      }

      toast.success("Mantenimiento actualizado");
      setEditDialogOpen(false);
      setSelectedLog(null);
      refetch();
    } catch {
      toast.error("No fue posible actualizar");
    } finally {
      setActionLoading(false);
    }
  };

  const openCompleteDialog = (log: MaintenanceLog) => {
    setSelectedLog(log);
    setCompleteDialogOpen(true);
  };

  const handleCompleteMaintenance = async () => {
    if (!selectedLog) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/mantenimientos/${selectedLog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED", completedDate: new Date().toISOString() }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible actualizar");
        return;
      }

      toast.success("Mantenimiento marcado como completado");
      setCompleteDialogOpen(false);
      setSelectedLog(null);
      refetch();
    } catch {
      toast.error("No fue posible actualizar");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loading text="Cargando mantenimientos..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <DashboardPageHeader
        eyebrow="Soporte"
        title="Mantenimiento"
        description="Programa y gestiona el mantenimiento de activos"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Mantenimiento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Mantenimiento</DialogTitle>
              <DialogDescription>Programa un nuevo mantenimiento</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.qrCode || asset.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY") =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVE">Preventivo</SelectItem>
                    <SelectItem value="CORRECTIVE">Correctivo</SelectItem>
                    <SelectItem value="EMERGENCY">Emergencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripcion *</Label>
                <Textarea
                  placeholder="Descripcion del mantenimiento..."
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha programada *</Label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, scheduledDate: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Costo estimado</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.cost}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, cost: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tecnico</Label>
                <Select
                  value={formData.technicianId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, technicianId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
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
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Notas adicionales..."
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
              <Button onClick={handleCreateMaintenance} disabled={submitting}>
                {submitting ? "Programando..." : "Programar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        }
      />

      <div className="space-y-3">
        {maintenanceLogs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-xl ${
                        log.type === "EMERGENCY"
                          ? "bg-red-500/10"
                          : log.type === "CORRECTIVE"
                            ? "bg-amber-500/10"
                            : "bg-blue-500/10"
                      }`}
                    >
                      <Wrench className={`h-6 w-6 ${typeLabels[log.type].color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{log.asset.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.asset.qrCode || log.asset.id}
                        </Badge>
                        <Badge variant={statusColors[log.status].variant}>
                          {statusColors[log.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">{log.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(log.scheduledDate)}
                        </span>
                        {log.cost && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(log.cost)}
                          </span>
                        )}
                        {log.technician && (
                          <span>
                            👤 {log.technician.name} {log.technician.lastName}
                          </span>
                        )}
                      </div>
                      {log.notes && <p className="text-xs text-muted-foreground mt-1">📝 {log.notes}</p>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(log)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCompleteDialog(log)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar completado
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {maintenanceLogs.filter((log) => log.status === "PENDING").length}
                </p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Wrench className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {maintenanceLogs.filter((log) => log.status === "IN_PROGRESS").length}
                </p>
                <p className="text-sm text-muted-foreground">En progreso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {maintenanceLogs.filter((log) => log.status === "COMPLETED").length}
                </p>
                <p className="text-sm text-muted-foreground">Completados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    maintenanceLogs.reduce((acc, log) => acc + (log.cost || 0), 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Costo total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar mantenimiento</DialogTitle>
            <DialogDescription>Actualiza todos los campos del mantenimiento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={editFormData.type}
                  onValueChange={(value: "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY") =>
                    setEditFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREVENTIVE">Preventivo</SelectItem>
                    <SelectItem value="CORRECTIVE">Correctivo</SelectItem>
                    <SelectItem value="EMERGENCY">Emergencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(
                    value: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
                  ) => setEditFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
                    <SelectItem value="COMPLETED">Completado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                value={editFormData.description}
                onChange={(event) =>
                  setEditFormData((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha programada</Label>
                <Input
                  type="date"
                  value={editFormData.scheduledDate}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, scheduledDate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Costo</Label>
                <Input
                  type="number"
                  value={editFormData.cost}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, cost: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tecnico</Label>
              <Select
                value={editFormData.technicianId}
                onValueChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, technicianId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tecnico</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={editFormData.notes}
                onChange={(event) =>
                  setEditFormData((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditMaintenance} disabled={actionLoading}>
              {actionLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        title="Marcar como completado"
        description={`Se marcara como completado el mantenimiento de ${selectedLog?.asset.name || "este activo"}.`}
        confirmLabel="Completar"
        onConfirm={handleCompleteMaintenance}
        loading={actionLoading}
      />
    </motion.div>
  );
}
