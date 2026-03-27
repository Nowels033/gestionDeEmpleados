"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
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

interface Contract {
  id: string;
  name: string;
  type: "SERVICE" | "WARRANTY" | "INSURANCE" | "LEASE" | "LICENSE" | "MAINTENANCE";
  provider: string;
  startDate: string;
  endDate: string;
  value: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "RENEWED";
  assetName?: string;
  assetId?: string;
  department?: string;
  notes?: string;
  daysUntilExpiry: number;
}

const contracts: Contract[] = [
  {
    id: "1",
    name: "Soporte técnico Dell",
    type: "SERVICE",
    provider: "Dell Technologies",
    startDate: "2024-01-01",
    endDate: "2025-01-01",
    value: 25000,
    status: "ACTIVE",
    assetName: "Laptop Dell XPS 15",
    assetId: "ACT-0042",
    daysUntilExpiry: 280,
  },
  {
    id: "2",
    name: "Garantía extendida Apple",
    type: "WARRANTY",
    provider: "Apple",
    startDate: "2024-03-15",
    endDate: "2026-03-15",
    value: 8500,
    status: "ACTIVE",
    assetName: 'MacBook Pro 14"',
    assetId: "ACT-0089",
    daysUntilExpiry: 718,
  },
  {
    id: "3",
    name: "Seguro de vehículos",
    type: "INSURANCE",
    provider: "AXA Seguros",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    value: 45000,
    status: "ACTIVE",
    department: "Ventas",
    daysUntilExpiry: 279,
  },
  {
    id: "4",
    name: "Licencia Microsoft 365",
    type: "LICENSE",
    provider: "Microsoft",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    value: 120000,
    status: "ACTIVE",
    department: "Tecnología",
    notes: "50 licencias Business Standard",
    daysUntilExpiry: 279,
  },
  {
    id: "5",
    name: "Mantenimiento servidores",
    type: "MAINTENANCE",
    provider: "IBM México",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    value: 35000,
    status: "ACTIVE",
    assetName: "Servidor Dell PowerEdge",
    assetId: "ACT-0201",
    daysUntilExpiry: 65,
  },
  {
    id: "6",
    name: "Arrendamiento impresoras",
    type: "LEASE",
    provider: "Xerox México",
    startDate: "2023-01-01",
    endDate: "2024-03-01",
    value: 18000,
    status: "EXPIRED",
    department: "Administración",
    notes: "3 impresoras multifuncionales",
    daysUntilExpiry: -26,
  },
];

const typeLabels: Record<string, { label: string; icon: string }> = {
  SERVICE: { label: "Servicio", icon: "🔧" },
  WARRANTY: { label: "Garantía", icon: "🛡️" },
  INSURANCE: { label: "Seguro", icon: "📋" },
  LEASE: { label: "Arrendamiento", icon: "📄" },
  LICENSE: { label: "Licencia", icon: "📀" },
  MAINTENANCE: { label: "Mantenimiento", icon: "🔧" },
};

const statusColors: Record<string, { label: string; variant: "success" | "destructive" | "secondary" | "warning" }> = {
  ACTIVE: { label: "Activo", variant: "success" },
  EXPIRED: { label: "Vencido", variant: "destructive" },
  CANCELLED: { label: "Cancelado", variant: "secondary" },
  RENEWED: { label: "Renovado", variant: "warning" },
};

export default function ContratosPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos y Licencias</h1>
          <p className="text-muted-foreground">
            Gestiona contratos de servicio, garantías, seguros y licencias
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
              <DialogDescription>
                Registra un nuevo contrato o licencia
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input placeholder="Ej: Soporte técnico Dell" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SERVICE">Servicio</SelectItem>
                      <SelectItem value="WARRANTY">Garantía</SelectItem>
                      <SelectItem value="INSURANCE">Seguro</SelectItem>
                      <SelectItem value="LEASE">Arrendamiento</SelectItem>
                      <SelectItem value="LICENSE">Licencia</SelectItem>
                      <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Proveedor *</Label>
                  <Input placeholder="Nombre del proveedor" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha inicio *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin *</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea placeholder="Notas adicionales..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contracts List */}
      <div className="space-y-3">
        {contracts.map((contract, index) => (
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
                      {typeLabels[contract.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{contract.name}</span>
                        <Badge variant={statusColors[contract.status]?.variant}>
                          {statusColors[contract.status]?.label}
                        </Badge>
                        {contract.daysUntilExpiry <= 30 &&
                          contract.status === "ACTIVE" && (
                            <Badge variant="warning">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Vence en {contract.daysUntilExpiry} días
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
                          {formatDate(contract.startDate)} -{" "}
                          {formatDate(contract.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(contract.value)}
                        </span>
                      </div>
                      {contract.assetName && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📦 {contract.assetName} ({contract.assetId})
                        </p>
                      )}
                      {contract.department && (
                        <p className="text-sm text-muted-foreground mt-1">
                          🏢 {contract.department}
                        </p>
                      )}
                      {contract.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📝 {contract.notes}
                        </p>
                      )}
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {contracts.filter((c) => c.status === "ACTIVE").length}
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
                    contracts.filter(
                      (c) => c.daysUntilExpiry <= 30 && c.status === "ACTIVE"
                    ).length
                  }
                </p>
                <p className="text-sm text-muted-foreground">Próximos a vencer</p>
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
                  {contracts.filter((c) => c.status === "EXPIRED").length}
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
                    contracts
                      .filter((c) => c.status === "ACTIVE")
                      .reduce((acc, c) => acc + c.value, 0)
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
