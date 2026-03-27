"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  Package,
  Users,
  MapPin,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Department {
  id: string;
  name: string;
  description: string;
  location: string;
  manager: string;
  employeeCount: number;
  assetCount: number;
  assetValue: number;
}

const departments: Department[] = [
  {
    id: "1",
    name: "Tecnología",
    description: "Desarrollo e infraestructura TI",
    location: "Edificio A, Piso 3",
    manager: "María López",
    employeeCount: 12,
    assetCount: 48,
    assetValue: 890000,
  },
  {
    id: "2",
    name: "Operaciones",
    description: "Producción y logística",
    location: "Edificio B, Piso 1",
    manager: "Carlos Mendoza",
    employeeCount: 25,
    assetCount: 35,
    assetValue: 520000,
  },
  {
    id: "3",
    name: "Ventas",
    description: "Equipo comercial",
    location: "Edificio A, Piso 2",
    manager: "Pedro Ruiz",
    employeeCount: 18,
    assetCount: 28,
    assetValue: 380000,
  },
  {
    id: "4",
    name: "Administración",
    description: "Finanzas, RRHH y legal",
    location: "Edificio A, Piso 1",
    manager: "Ana Torres",
    employeeCount: 10,
    assetCount: 22,
    assetValue: 350000,
  },
  {
    id: "5",
    name: "Marketing",
    description: "Publicidad y comunicación",
    location: "Edificio A, Piso 2",
    manager: "Luis García",
    employeeCount: 8,
    assetCount: 15,
    assetValue: 310000,
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(value);
};

export default function DepartamentosPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departamentos</h1>
          <p className="text-muted-foreground">
            Gestiona los departamentos de tu organización
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Departamento</DialogTitle>
              <DialogDescription>
                Crea un nuevo departamento en tu organización
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" placeholder="Ej: Tecnología" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción del departamento..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input id="location" placeholder="Ej: Edificio A, Piso 3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Responsable</Label>
                <Input id="manager" placeholder="Nombre del responsable" />
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

      {/* Departments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept, index) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="h-2 bg-gradient-to-r from-primary to-primary/50" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{dept.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {dept.description}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
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

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{dept.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Responsable: {dept.manager}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{dept.employeeCount}</p>
                    <p className="text-xs text-muted-foreground">Empleados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{dept.assetCount}</p>
                    <p className="text-xs text-muted-foreground">Activos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">
                      {formatCurrency(dept.assetValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver activos del departamento
                </Button>
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
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departments.length}</p>
                <p className="text-sm text-muted-foreground">Departamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {departments.reduce((acc, d) => acc + d.employeeCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Empleados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Package className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {departments.reduce((acc, d) => acc + d.assetCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Activos totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <span className="text-purple-500 font-bold">💰</span>
              </div>
              <div>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    departments.reduce((acc, d) => acc + d.assetValue, 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Valor total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
