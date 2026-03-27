"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  Plus,
  Search,
  Package,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Eye,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MaintenanceLog {
  id: string;
  assetId: string;
  assetName: string;
  type: "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY";
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledDate: string;
  completedDate?: string;
  cost?: number;
  technician?: string;
  notes?: string;
}

const maintenanceLogs: MaintenanceLog[] = [
  {
    id: "1",
    assetId: "ACT-0189",
    assetName: "Impresora HP LaserJet",
    type: "CORRECTIVE",
    description: "Papel atascado, revisar rodillos",
    status: "IN_PROGRESS",
    scheduledDate: "2024-03-25",
    technician: "Carlos Mendoza",
    notes: "Esperando repuesto",
  },
  {
    id: "2",
    assetId: "ACT-0042",
    assetName: "Laptop Dell XPS 15",
    type: "PREVENTIVE",
    description: "Limpieza general y actualización de software",
    status: "PENDING",
    scheduledDate: "2024-04-10",
    cost: 500,
  },
  {
    id: "3",
    assetId: "ACT-0201",
    assetName: "Servidor Dell PowerEdge",
    type: "PREVENTIVE",
    description: "Verificación de discos y actualización de firmware",
    status: "COMPLETED",
    scheduledDate: "2024-03-15",
    completedDate: "2024-03-15",
    cost: 2000,
    technician: "Carlos Mendoza",
  },
  {
    id: "4",
    assetId: "ACT-0156",
    assetName: "Camioneta Toyota Hilux",
    type: "PREVENTIVE",
    description: "Cambio de aceite y filtros",
    status: "PENDING",
    scheduledDate: "2024-04-05",
    cost: 3500,
  },
  {
    id: "5",
    assetId: "ACT-0123",
    assetName: 'Monitor Samsung 27"',
    type: "EMERGENCY",
    description: "Pantalla parpadeando, posible falla de backlight",
    status: "COMPLETED",
    scheduledDate: "2024-03-10",
    completedDate: "2024-03-12",
    cost: 4500,
    technician: "Luis García",
    notes: "Reemplazo de backlight",
  },
];

const typeLabels: Record<string, { label: string; color: string }> = {
  PREVENTIVE: { label: "Preventivo", color: "text-blue-500" },
  CORRECTIVE: { label: "Correctivo", color: "text-amber-500" },
  EMERGENCY: { label: "Emergencia", color: "text-red-500" },
};

const statusColors: Record<string, { label: string; variant: "warning" | "info" | "success" | "secondary" }> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  IN_PROGRESS: { label: "En progreso", variant: "info" },
  COMPLETED: { label: "Completado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "secondary" },
};

export default function MantenimientoPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Mantenimiento</h1>
          <p className="text-muted-foreground">
            Programa y gestiona el mantenimiento de activos
          </p>
        </div>
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
              <DialogDescription>
                Programa un nuevo mantenimiento
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Activo *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar activo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACT-0042">Laptop Dell XPS 15</SelectItem>
                    <SelectItem value="ACT-0123">Monitor Samsung 27"</SelectItem>
                    <SelectItem value="ACT-0156">Camioneta Toyota Hilux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select>
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
                <Label>Descripción *</Label>
                <Textarea placeholder="Descripción del mantenimiento..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha programada *</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Costo estimado</Label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Técnico</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carlos">Carlos Mendoza</SelectItem>
                    <SelectItem value="luis">Luis García</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Programar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Maintenance List */}
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
                      <Wrench
                        className={`h-6 w-6 ${typeLabels[log.type]?.color}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{log.assetName}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.assetId}
                        </Badge>
                        <Badge variant={statusColors[log.status]?.variant}>
                          {statusColors[log.status]?.label}
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
                          <span>👤 {log.technician}</span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📝 {log.notes}
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
                      <DropdownMenuItem>
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {maintenanceLogs.filter((l) => l.status === "PENDING").length}
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
                  {maintenanceLogs.filter((l) => l.status === "IN_PROGRESS").length}
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
                  {maintenanceLogs.filter((l) => l.status === "COMPLETED").length}
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
                    maintenanceLogs.reduce((acc, l) => acc + (l.cost || 0), 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Costo total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
