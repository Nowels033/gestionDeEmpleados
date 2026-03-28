"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Calendar,
  DollarSign,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFetch } from "@/lib/hooks/use-fetch";
import toast from "react-hot-toast";

interface Contract {
  id: string;
  name: string;
  type: "SERVICE" | "WARRANTY" | "INSURANCE" | "LEASE" | "LICENSE" | "MAINTENANCE";
  provider: string;
  startDate: string;
  endDate: string;
  value: number | null;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "RENEWED";
  notes: string | null;
  asset: {
    id: string;
    name: string;
    qrCode: string | null;
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
}

interface DepartmentOption {
  id: string;
  name: string;
}

const typeLabels: Record<string, { label: string; icon: string }> = {
  SERVICE: { label: "Servicio", icon: "🔧" },
  WARRANTY: { label: "Garantia", icon: "🛡️" },
  INSURANCE: { label: "Seguro", icon: "📋" },
  LEASE: { label: "Arrendamiento", icon: "📄" },
  LICENSE: { label: "Licencia", icon: "📀" },
  MAINTENANCE: { label: "Mantenimiento", icon: "🔧" },
};

const statusColors: Record<
  string,
  { label: string; variant: "success" | "destructive" | "secondary" | "warning" }
> = {
  ACTIVE: { label: "Activo", variant: "success" },
  EXPIRED: { label: "Vencido", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "secondary" },
  RENEWED: { label: "Renovado", variant: "warning" },
};

export default function ContratosPage() {
  const { data: contracts, loading, refetch } = useFetch<Contract[]>("/api/contratos", []);
  const { data: assets } = useFetch<AssetOption[]>("/api/activos", []);
  const { data: departments } = useFetch<DepartmentOption[]>("/api/departamentos", []);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    type: "SERVICE" as
      | "SERVICE"
      | "WARRANTY"
      | "INSURANCE"
      | "LEASE"
      | "LICENSE"
      | "MAINTENANCE",
    provider: "",
    startDate: "",
    endDate: "",
    value: "",
    notes: "",
    assetId: "",
    departmentId: "",
  });

  const contractsWithExpiry = React.useMemo(() => {
    return contracts.map((contract) => {
      const today = new Date();
      const endDate = new Date(contract.endDate);
      const diffTime = endDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...contract, daysUntilExpiry };
    });
  }, [contracts]);

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

  const handleCreateContract = async () => {
    if (!formData.name || !formData.provider || !formData.startDate || !formData.endDate) {
      toast.error("Completa los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          provider: formData.provider,
          startDate: formData.startDate,
          endDate: formData.endDate,
          value: formData.value ? Number(formData.value) : undefined,
          notes: formData.notes || undefined,
          assetId: formData.assetId || undefined,
          departmentId: formData.departmentId || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible crear el contrato");
        return;
      }

      toast.success("Contrato creado correctamente");
      setDialogOpen(false);
      setFormData({
        name: "",
        type: "SERVICE",
        provider: "",
        startDate: "",
        endDate: "",
        value: "",
        notes: "",
        assetId: "",
        departmentId: "",
      });
      refetch();
    } catch {
      toast.error("No fue posible crear el contrato");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading text="Cargando contratos..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos y Licencias</h1>
          <p className="text-muted-foreground">
            Gestiona contratos de servicio, garantias, seguros y licencias
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nuevo Contrato</DialogTitle>
              <DialogDescription>Registra un nuevo contrato o licencia</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Ej: Soporte tecnico Dell"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(
                      value:
                        | "SERVICE"
                        | "WARRANTY"
                        | "INSURANCE"
                        | "LEASE"
                        | "LICENSE"
                        | "MAINTENANCE"
                    ) => setFormData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICE">Servicio</SelectItem>
                      <SelectItem value="WARRANTY">Garantia</SelectItem>
                      <SelectItem value="INSURANCE">Seguro</SelectItem>
                      <SelectItem value="LEASE">Arrendamiento</SelectItem>
                      <SelectItem value="LICENSE">Licencia</SelectItem>
                      <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Input
                    placeholder="Nombre del proveedor"
                    value={formData.provider}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, provider: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha inicio *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin *</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, endDate: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.value}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, value: event.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activo (opcional)</Label>
                  <Select
                    value={formData.assetId || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, assetId: value === "none" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin activo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin activo</SelectItem>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Departamento (opcional)</Label>
                  <Select
                    value={formData.departmentId || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        departmentId: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin departamento</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Notas adicionales..."
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
              <Button onClick={handleCreateContract} disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {contractsWithExpiry.map((contract, index) => (
          <motion.div
            key={contract.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card
              className={`hover:shadow-md transition-all duration-200 ${
                contract.daysUntilExpiry <= 30 && contract.status === "ACTIVE"
                  ? "border-amber-500/50"
                  : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-xl bg-primary/10 text-2xl">
                      {typeLabels[contract.type].icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{contract.name}</span>
                        <Badge variant={statusColors[contract.status].variant}>
                          {statusColors[contract.status].label}
                        </Badge>
                        {contract.daysUntilExpiry <= 30 && contract.status === "ACTIVE" && (
                          <Badge variant="warning">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Vence en {contract.daysUntilExpiry} dias
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {contract.provider}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                        </span>
                        {contract.value !== null && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(contract.value)}
                          </span>
                        )}
                      </div>
                      {contract.asset && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📦 {contract.asset.name} ({contract.asset.qrCode || contract.asset.id})
                        </p>
                      )}
                      {contract.department && (
                        <p className="text-sm text-muted-foreground mt-1">🏢 {contract.department.name}</p>
                      )}
                      {contract.notes && <p className="text-xs text-muted-foreground mt-1">📝 {contract.notes}</p>}
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
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
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
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contractsWithExpiry.filter((contract) => contract.status === "ACTIVE").length}
                </p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    contractsWithExpiry.filter(
                      (contract) => contract.daysUntilExpiry <= 30 && contract.status === "ACTIVE"
                    ).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">Proximos a vencer</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Clock className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contractsWithExpiry.filter((contract) => contract.status === "EXPIRED").length}
                </p>
                <p className="text-sm text-muted-foreground">Vencidos</p>
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
                    contractsWithExpiry
                      .filter((contract) => contract.status === "ACTIVE")
                      .reduce((acc, contract) => acc + (contract.value || 0), 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Valor activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
