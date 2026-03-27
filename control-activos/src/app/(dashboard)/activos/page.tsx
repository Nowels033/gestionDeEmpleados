"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileDown,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeSelect } from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import { useFetch } from "@/lib/hooks/use-fetch";
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
import toast from "react-hot-toast";

interface Asset {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  brand: string | null;
  model: string | null;
  purchasePrice: number | null;
  currentValue: number | null;
  status: string;
  location: string | null;
  qrCode: string | null;
  ensLevel: string;
  category: { id: string; name: string; icon: string | null };
  securityUser: { id: string; name: string; lastName: string };
  assignments: {
    user: { id: string; name: string; lastName: string } | null;
    department: { id: string; name: string } | null;
  }[];
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface User {
  id: string;
  name: string;
  lastName: string;
}

const statusConfig: Record<string, { label: string; variant: "success" | "info" | "warning" | "destructive" }> = {
  AVAILABLE: { label: "Disponible", variant: "success" },
  ASSIGNED: { label: "Asignado", variant: "info" },
  MAINTENANCE: { label: "Mantenimiento", variant: "warning" },
  RETIRED: { label: "Dado de baja", variant: "destructive" },
};

const ensConfig: Record<string, { label: string; color: string }> = {
  BASIC: { label: "Básico", color: "text-emerald-500" },
  MEDIUM: { label: "Medio", color: "text-amber-500" },
  HIGH: { label: "Alto", color: "text-red-500" },
};

export default function ActivosPage() {
  const { data: assets, loading: loadingAssets, refetch: refetchAssets } = useFetch<Asset[]>("/api/activos", []);
  const { data: categories } = useFetch<Category[]>("/api/categorias", []);
  const { data: users } = useFetch<User[]>("/api/usuarios", []);

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    serialNumber: "",
    brand: "",
    model: "",
    purchasePrice: "",
    currentValue: "",
    location: "",
    qrCode: "",
    ensLevel: "BASIC",
    categoryId: "",
    securityUserId: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      serialNumber: "",
      brand: "",
      model: "",
      purchasePrice: "",
      currentValue: "",
      location: "",
      qrCode: "",
      ensLevel: "BASIC",
      categoryId: "",
      securityUserId: "",
    });
  };

  const handleCreateAsset = async () => {
    if (!formData.name || !formData.categoryId || !formData.securityUserId) {
      toast.error("Completa los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/activos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          purchasePrice: formData.purchasePrice || null,
          currentValue: formData.currentValue || null,
          qrCode: formData.qrCode || `ACT-${Date.now()}`,
        }),
      });

      if (response.ok) {
        toast.success("Activo creado correctamente");
        setDialogOpen(false);
        resetForm();
        refetchAssets();
      } else {
        toast.error("Error al crear el activo");
      }
    } catch (error) {
      toast.error("Error al crear el activo");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (asset.qrCode?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || asset.category.id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Preparar opciones para selects
  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
    icon: cat.icon || undefined,
  }));

  const userOptions = users.map((user) => ({
    value: user.id,
    label: `${user.name} ${user.lastName}`,
  }));

  const statusOptions = [
    { value: "all", label: "Todos los estados" },
    { value: "AVAILABLE", label: "Disponible" },
    { value: "ASSIGNED", label: "Asignado" },
    { value: "MAINTENANCE", label: "Mantenimiento" },
    { value: "RETIRED", label: "Dado de baja" },
  ];

  if (loadingAssets) {
    return <Loading text="Cargando activos..." />;
  }

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
            {assets.length} activos registrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Activo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Activo</DialogTitle>
                <DialogDescription>Ingresa los datos del nuevo activo</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      placeholder="Ej: Laptop Dell XPS 15"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría *</Label>
                    <SafeSelect
                      value={formData.categoryId}
                      onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                      placeholder="Seleccionar"
                      items={categoryOptions}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Input
                      placeholder="Ej: Dell"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      placeholder="Ej: XPS 15"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Serie</Label>
                    <Input
                      placeholder="Ej: DLXPS-0042"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio de Compra</Label>
                    <Input
                      type="number"
                      placeholder="35000"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <Input
                      placeholder="Ej: Edificio A"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nivel ENS</Label>
                    <SafeSelect
                      value={formData.ensLevel}
                      onValueChange={(v) => setFormData({ ...formData, ensLevel: v })}
                      items={[
                        { value: "BASIC", label: "Básico" },
                        { value: "MEDIUM", label: "Medio" },
                        { value: "HIGH", label: "Alto" },
                      ]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Responsable de Seguridad *</Label>
                  <SafeSelect
                    value={formData.securityUserId}
                    onValueChange={(v) => setFormData({ ...formData, securityUserId: v })}
                    placeholder="Seleccionar"
                    items={userOptions}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Descripción del activo..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAsset} disabled={submitting}>
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
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
            placeholder="Buscar activos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <SafeSelect
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="Estado"
            items={statusOptions}
            className="w-[150px]"
          />
          <SafeSelect
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            placeholder="Categoría"
            items={[{ value: "all", label: "Todas" }, ...categoryOptions]}
            className="w-[150px]"
          />
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

      {/* Results */}
      <p className="text-sm text-muted-foreground">
        Mostrando {filteredAssets.length} de {assets.length} activos
      </p>

      {/* Assets */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">No se encontraron activos</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer activo
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-300" />
                  <Badge
                    variant={statusConfig[asset.status]?.variant}
                    className="absolute top-3 right-3"
                  >
                    {statusConfig[asset.status]?.label}
                  </Badge>
                  {asset.qrCode && (
                    <Badge variant="outline" className="absolute bottom-3 left-3 bg-background/80">
                      <QrCode className="h-3 w-3 mr-1" />
                      {asset.qrCode}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-1">{asset.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {asset.brand} {asset.model && `• ${asset.model}`}
                  </p>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">🏷️</span>
                      <span>{asset.category.icon} {asset.category.name}</span>
                    </div>
                    {asset.currentValue && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">💰</span>
                        <span className="font-medium">{formatCurrency(asset.currentValue)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">🔒</span>
                      <span>{asset.securityUser.name} {asset.securityUser.lastName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <FileDown className="h-4 w-4 mr-2" /> PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                  <th className="text-left p-4 font-medium text-sm">Código</th>
                  <th className="text-left p-4 font-medium text-sm">Nombre</th>
                  <th className="text-left p-4 font-medium text-sm">Categoría</th>
                  <th className="text-left p-4 font-medium text-sm">Estado</th>
                  <th className="text-left p-4 font-medium text-sm">Valor</th>
                  <th className="text-right p-4 font-medium text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b hover:bg-muted/30">
                    <td className="p-4 text-sm font-mono">{asset.qrCode || asset.id.slice(0, 8)}</td>
                    <td className="p-4">
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">{asset.brand} {asset.model}</p>
                    </td>
                    <td className="p-4 text-sm">{asset.category.icon} {asset.category.name}</td>
                    <td className="p-4">
                      <Badge variant={statusConfig[asset.status]?.variant}>
                        {statusConfig[asset.status]?.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm font-medium">{formatCurrency(asset.currentValue)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
