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
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
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

interface Assignment {
  id: string;
  type: "PERSONAL" | "DEPARTAMENTAL";
  status: "ACTIVE" | "RETURNED" | "TRANSFERRED";
  assetId: string;
  assetName: string;
  assetCategory: string;
  userId?: string;
  userName?: string;
  departmentId?: string;
  departmentName?: string;
  assignedAt: string;
  returnedAt?: string;
  notes?: string;
  hasSignature: boolean;
}

const assignments: Assignment[] = [
  {
    id: "1",
    type: "PERSONAL",
    status: "ACTIVE",
    assetId: "ACT-0042",
    assetName: "Laptop Dell XPS 15",
    assetCategory: "Laptops",
    userId: "1",
    userName: "Juan Pérez García",
    departmentId: "1",
    departmentName: "Tecnología",
    assignedAt: "2024-01-10",
    notes: "Equipo nuevo",
    hasSignature: true,
  },
  {
    id: "2",
    type: "PERSONAL",
    status: "ACTIVE",
    assetId: "ACT-0089",
    assetName: 'MacBook Pro 14"',
    assetCategory: "Laptops",
    userId: "2",
    userName: "María López García",
    departmentId: "1",
    departmentName: "Tecnología",
    assignedAt: "2024-03-15",
    hasSignature: true,
  },
  {
    id: "3",
    type: "DEPARTAMENTAL",
    status: "ACTIVE",
    assetId: "ACT-0123",
    assetName: "Monitor Samsung 27\"",
    assetCategory: "Monitores",
    departmentId: "1",
    departmentName: "Tecnología",
    assignedAt: "2024-02-20",
    notes: "Sala de juntas",
    hasSignature: false,
  },
  {
    id: "4",
    type: "PERSONAL",
    status: "ACTIVE",
    assetId: "ACT-0156",
    assetName: "Camioneta Toyota Hilux",
    assetCategory: "Vehículos",
    userId: "3",
    userName: "Pedro Ruiz Martínez",
    departmentId: "3",
    departmentName: "Ventas",
    assignedAt: "2024-01-05",
    hasSignature: true,
  },
  {
    id: "5",
    type: "PERSONAL",
    status: "RETURNED",
    assetId: "ACT-0189",
    assetName: "Impresora HP LaserJet",
    assetCategory: "Periféricos",
    userId: "4",
    userName: "Ana Torres Sánchez",
    departmentId: "4",
    departmentName: "Administración",
    assignedAt: "2023-06-10",
    returnedAt: "2024-03-01",
    notes: "Enviada a mantenimiento",
    hasSignature: true,
  },
];

const statusColors: Record<string, { label: string; variant: "success" | "warning" | "secondary"; icon: any }> = {
  ACTIVE: { label: "Activo", variant: "success", icon: CheckCircle },
  RETURNED: { label: "Devuelto", variant: "secondary", icon: XCircle },
  TRANSFERRED: { label: "Transferido", variant: "warning", icon: ArrowLeftRight },
};

export default function AsignacionesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.userName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesType = typeFilter === "all" || a.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Asignaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las asignaciones de activos a usuarios y departamentos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Asignación
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nueva Asignación</DialogTitle>
              <DialogDescription>
                Asigna un activo a un usuario o departamento
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de asignación *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal (a un usuario)</SelectItem>
                    <SelectItem value="DEPARTAMENTAL">
                      Departamental (a un área)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Activo *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar activo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACT-0123">
                      Monitor Samsung 27" (ACT-0123)
                    </SelectItem>
                    <SelectItem value="ACT-0189">
                      Impresora HP LaserJet (ACT-0189)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Usuario *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Juan Pérez García</SelectItem>
                    <SelectItem value="2">María López García</SelectItem>
                    <SelectItem value="3">Pedro Ruiz Martínez</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones sobre la asignación..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setDialogOpen(false)}>Asignar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por activo, usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
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
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {filteredAssignments.map((assignment, index) => {
          const StatusIcon = statusColors[assignment.status]?.icon;
          return (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{assignment.assetName}</span>
                          <Badge variant="outline" className="text-xs">
                            {assignment.assetId}
                          </Badge>
                          <Badge variant={statusColors[assignment.status]?.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusColors[assignment.status]?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {assignment.userName && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {assignment.userName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {assignment.departmentName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(assignment.assignedAt)}
                          </span>
                          {assignment.hasSignature && (
                            <Badge variant="success" className="text-xs">
                              ✍️ Firmado
                            </Badge>
                          )}
                        </div>
                        {assignment.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📝 {assignment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            Transferir
                          </DropdownMenuItem>
                          <DropdownMenuItem>
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
        })}
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
                  {assignments.filter((a) => a.status === "ACTIVE").length}
                </p>
                <p className="text-sm text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <ArrowLeftRight className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter((a) => a.type === "PERSONAL").length}
                </p>
                <p className="text-sm text-muted-foreground">Personales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter((a) => a.type === "DEPARTAMENTAL").length}
                </p>
                <p className="text-sm text-muted-foreground">Departamentales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <span className="text-xl">✍️</span>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.filter((a) => a.hasSignature).length}
                </p>
                <p className="text-sm text-muted-foreground">Con firma</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
