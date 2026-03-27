"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileDown,
  QrCode,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// Datos de ejemplo
const assets = [
  {
    id: "ACT-0042",
    name: "Laptop Dell XPS 15",
    category: "Laptops",
    brand: "Dell",
    model: "XPS 15 9530",
    serialNumber: "DLXPS-2024-0042",
    status: "ASSIGNED",
    user: "Juan Pérez",
    department: "Tecnología",
    price: 35000,
    location: "Edificio A, Piso 3",
    securityUser: "Carlos Mendoza",
    ensLevel: "MEDIUM",
    purchaseDate: "2024-01-10",
    photo: null,
  },
  {
    id: "ACT-0089",
    name: 'MacBook Pro 14"',
    category: "Laptops",
    brand: "Apple",
    model: 'MacBook Pro 14" M3',
    serialNumber: "MBP-2024-0089",
    status: "ASSIGNED",
    user: "María López",
    department: "Tecnología",
    price: 45000,
    location: "Edificio A, Piso 3",
    securityUser: "Carlos Mendoza",
    ensLevel: "HIGH",
    purchaseDate: "2024-03-15",
    photo: null,
  },
  {
    id: "ACT-0123",
    name: "Monitor Samsung 27\"",
    category: "Monitores",
    brand: "Samsung",
    model: "Odyssey G7",
    serialNumber: "SAM-2024-0123",
    status: "AVAILABLE",
    user: null,
    department: "Sala de Juntas",
    price: 12000,
    location: "Edificio B, Piso 1",
    securityUser: "Ana Torres",
    ensLevel: "BASIC",
    purchaseDate: "2024-02-20",
    photo: null,
  },
  {
    id: "ACT-0156",
    name: "Camioneta Toyota Hilux",
    category: "Vehículos",
    brand: "Toyota",
    model: "Hilux 4x4",
    serialNumber: "TOY-2024-0156",
    status: "ASSIGNED",
    user: "Pedro Ruiz",
    department: "Ventas",
    price: 650000,
    location: "Estacionamiento",
    securityUser: "Luis García",
    ensLevel: "MEDIUM",
    purchaseDate: "2024-01-05",
    photo: null,
  },
  {
    id: "ACT-0189",
    name: "Impresora HP LaserJet",
    category: "Periféricos",
    brand: "HP",
    model: "LaserJet Pro MFP",
    serialNumber: "HP-2024-0189",
    status: "MAINTENANCE",
    user: null,
    department: "Administración",
    price: 8500,
    location: "Edificio A, Piso 1",
    securityUser: "Ana Torres",
    ensLevel: "BASIC",
    purchaseDate: "2023-06-10",
    photo: null,
  },
  {
    id: "ACT-0201",
    name: "Servidor Dell PowerEdge",
    category: "Servidores",
    brand: "Dell",
    model: "PowerEdge R740",
    serialNumber: "DL-2024-0201",
    status: "ASSIGNED",
    user: null,
    department: "Tecnología",
    price: 280000,
    location: "Sala de servidores",
    securityUser: "Carlos Mendoza",
    ensLevel: "HIGH",
    purchaseDate: "2023-08-15",
    photo: null,
  },
];

const statusColors: Record<string, { label: string; variant: "success" | "info" | "warning" | "destructive" }> = {
  AVAILABLE: { label: "Disponible", variant: "success" },
  ASSIGNED: { label: "Asignado", variant: "info" },
  MAINTENANCE: { label: "Mantenimiento", variant: "warning" },
  RETIRED: { label: "Dado de baja", variant: "destructive" },
};

const ensColors: Record<string, { label: string; color: string }> = {
  BASIC: { label: "Básico", color: "text-emerald-500" },
  MEDIUM: { label: "Medio", color: "text-amber-500" },
  HIGH: { label: "Alto", color: "text-red-500" },
};

export default function ActivosPage() {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || asset.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(value);
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
          <h1 className="text-3xl font-bold tracking-tight">Activos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los activos de tu empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Activo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Nuevo Activo</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del nuevo activo
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input id="name" placeholder="Ej: Laptop Dell XPS 15" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="laptops">Laptops</SelectItem>
                        <SelectItem value="monitores">Monitores</SelectItem>
                        <SelectItem value="vehiculos">Vehículos</SelectItem>
                        <SelectItem value="mobiliario">Mobiliario</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca</Label>
                    <Input id="brand" placeholder="Ej: Dell" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input id="model" placeholder="Ej: XPS 15 9530" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Número de Serie</Label>
                    <Input id="serialNumber" placeholder="Ej: DLXPS-2024-0042" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio de Compra</Label>
                    <Input id="price" type="number" placeholder="35000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input id="location" placeholder="Ej: Edificio A, Piso 3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ensLevel">Nivel ENS</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASIC">Básico</SelectItem>
                        <SelectItem value="MEDIUM">Medio</SelectItem>
                        <SelectItem value="HIGH">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="securityUser">Responsable de Seguridad *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carlos">Carlos Mendoza</SelectItem>
                      <SelectItem value="ana">Ana Torres</SelectItem>
                      <SelectItem value="luis">Luis García</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción del activo..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Foto del Activo</Label>
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8" />
                      <span className="text-sm">Clic para subir foto</span>
                    </div>
                  </div>
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
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o serie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="AVAILABLE">Disponible</SelectItem>
              <SelectItem value="ASSIGNED">Asignado</SelectItem>
              <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
              <SelectItem value="RETIRED">Dado de baja</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Laptops">Laptops</SelectItem>
              <SelectItem value="Monitores">Monitores</SelectItem>
              <SelectItem value="Vehículos">Vehículos</SelectItem>
              <SelectItem value="Periféricos">Periféricos</SelectItem>
              <SelectItem value="Servidores">Servidores</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredAssets.length} de {assets.length} activos
        </p>
      </div>

      {/* Assets Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                {/* Image placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                  <Package className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-300" />
                  <Badge
                    variant={statusColors[asset.status]?.variant}
                    className="absolute top-3 right-3"
                  >
                    {statusColors[asset.status]?.label}
                  </Badge>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                      <QrCode className="h-3 w-3 mr-1" />
                      {asset.id}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">
                        {asset.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {asset.brand} • {asset.model}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      {asset.user && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">👤</span>
                          <span>{asset.user}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">🏢</span>
                        <span>{asset.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">💰</span>
                        <span className="font-medium">
                          {formatCurrency(asset.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">🔒</span>
                        <span>{asset.securityUser}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">📋</span>
                        <span className={ensColors[asset.ensLevel]?.color}>
                          ENS: {ensColors[asset.ensLevel]?.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/dashboard/activos/${asset.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileDown className="h-4 w-4 mr-2" />
                            Exportar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <QrCode className="h-4 w-4 mr-2" />
                            Ver QR
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-sm">
                    <Button variant="ghost" size="sm" className="-ml-3">
                      Código <ArrowUpDown className="h-4 w-4 ml-1" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-medium text-sm">Nombre</th>
                  <th className="text-left p-4 font-medium text-sm">Categoría</th>
                  <th className="text-left p-4 font-medium text-sm">Estado</th>
                  <th className="text-left p-4 font-medium text-sm">Usuario</th>
                  <th className="text-left p-4 font-medium text-sm">Depto</th>
                  <th className="text-left p-4 font-medium text-sm">Valor</th>
                  <th className="text-left p-4 font-medium text-sm">Resp. Seg.</th>
                  <th className="text-right p-4 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, index) => (
                  <motion.tr
                    key={asset.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 text-sm font-mono">{asset.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.brand} {asset.model}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{asset.category}</td>
                    <td className="p-4">
                      <Badge variant={statusColors[asset.status]?.variant}>
                        {statusColors[asset.status]?.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">{asset.user || "-"}</td>
                    <td className="p-4 text-sm">{asset.department}</td>
                    <td className="p-4 text-sm font-medium">
                      {formatCurrency(asset.price)}
                    </td>
                    <td className="p-4 text-sm">{asset.securityUser}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/dashboard/activos/${asset.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <FileDown className="h-4 w-4 mr-2" />
                              PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
