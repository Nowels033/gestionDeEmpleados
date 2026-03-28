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
  Columns3,
  Save,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeSelect } from "@/components/ui/select";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { useFetch } from "@/lib/hooks/use-fetch";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

const columnDefinitions = [
  { key: "code", label: "Codigo" },
  { key: "name", label: "Nombre" },
  { key: "category", label: "Categoria" },
  { key: "status", label: "Estado" },
  { key: "value", label: "Valor" },
  { key: "owner", label: "Responsable" },
] as const;

type AssetColumnKey = (typeof columnDefinitions)[number]["key"];

interface SavedAssetView {
  id: string;
  name: string;
  viewMode: "grid" | "list";
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
}

export default function ActivosPage() {
  const FILTERS_STORAGE_KEY = "activos.filters.v1";
  const VIEWS_STORAGE_KEY = "activos.saved-views.v1";

  const { data: assets, loading: loadingAssets, refetch: refetchAssets } = useFetch<Asset[]>("/api/activos", []);
  const { data: categories } = useFetch<Category[]>("/api/categorias", []);
  const { data: users } = useFetch<User[]>("/api/usuarios", []);

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [bulkUpdatingStatus, setBulkUpdatingStatus] = React.useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [filtersHydrated, setFiltersHydrated] = React.useState(false);
  const [selectedColumns, setSelectedColumns] = React.useState<AssetColumnKey[]>([
    "code",
    "name",
    "category",
    "status",
    "value",
  ]);
  const [savedViews, setSavedViews] = React.useState<SavedAssetView[]>([]);
  const [selectedSavedView, setSelectedSavedView] = React.useState("none");
  const [saveViewDialogOpen, setSaveViewDialogOpen] = React.useState(false);
  const [newViewName, setNewViewName] = React.useState("");
  const [editFormData, setEditFormData] = React.useState({
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
    status: "AVAILABLE",
    categoryId: "",
    securityUserId: "",
  });

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

  React.useEffect(() => {
    if (filtersHydrated) {
      return;
    }

    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          viewMode?: "grid" | "list";
          searchQuery?: string;
          statusFilter?: string;
          categoryFilter?: string;
          selectedColumns?: AssetColumnKey[];
        };

        if (parsed.viewMode === "grid" || parsed.viewMode === "list") {
          setViewMode(parsed.viewMode);
        }
        if (typeof parsed.searchQuery === "string") {
          setSearchQuery(parsed.searchQuery);
        }
        if (typeof parsed.statusFilter === "string") {
          setStatusFilter(parsed.statusFilter);
        }
        if (typeof parsed.categoryFilter === "string") {
          setCategoryFilter(parsed.categoryFilter);
        }
        if (Array.isArray(parsed.selectedColumns) && parsed.selectedColumns.length > 0) {
          const validColumns = parsed.selectedColumns.filter((column): column is AssetColumnKey =>
            columnDefinitions.some((definition) => definition.key === column)
          );
          if (validColumns.length > 0) {
            setSelectedColumns(validColumns);
          }
        }
      }

      const rawViews = localStorage.getItem(VIEWS_STORAGE_KEY);
      if (rawViews) {
        const parsedViews = JSON.parse(rawViews) as SavedAssetView[];
        if (Array.isArray(parsedViews)) {
          setSavedViews(parsedViews);
        }
      }
    } catch {
      // noop
    } finally {
      setFiltersHydrated(true);
    }
  }, [filtersHydrated, FILTERS_STORAGE_KEY]);

  React.useEffect(() => {
    if (!filtersHydrated) {
      return;
    }

    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        viewMode,
        searchQuery,
        statusFilter,
        categoryFilter,
        selectedColumns,
      })
    );
    localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
  }, [
    viewMode,
    searchQuery,
    statusFilter,
    categoryFilter,
    selectedColumns,
    savedViews,
    filtersHydrated,
    FILTERS_STORAGE_KEY,
    VIEWS_STORAGE_KEY,
  ]);

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
    } catch {
      toast.error("Error al crear el activo");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setEditFormData({
      name: asset.name,
      description: asset.description || "",
      serialNumber: asset.serialNumber || "",
      brand: asset.brand || "",
      model: asset.model || "",
      purchasePrice: asset.purchasePrice?.toString() || "",
      currentValue: asset.currentValue?.toString() || "",
      location: asset.location || "",
      qrCode: asset.qrCode || "",
      ensLevel: asset.ensLevel,
      status: asset.status,
      categoryId: asset.category.id,
      securityUserId: asset.securityUser.id,
    });
    setEditDialogOpen(true);
  };

  const handleEditAsset = async () => {
    if (!selectedAsset) {
      return;
    }

    if (!editFormData.name.trim() || !editFormData.categoryId || !editFormData.securityUserId) {
      toast.error("Completa los campos requeridos");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/activos/${selectedAsset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          description: editFormData.description || null,
          serialNumber: editFormData.serialNumber || null,
          brand: editFormData.brand || null,
          model: editFormData.model || null,
          purchasePrice: editFormData.purchasePrice ? Number(editFormData.purchasePrice) : null,
          currentValue: editFormData.currentValue ? Number(editFormData.currentValue) : null,
          location: editFormData.location || null,
          qrCode: editFormData.qrCode || null,
          ensLevel: editFormData.ensLevel,
          status: editFormData.status,
          categoryId: editFormData.categoryId,
          securityUserId: editFormData.securityUserId,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible actualizar");
        return;
      }

      toast.success("Activo actualizado");
      setEditDialogOpen(false);
      setSelectedAsset(null);
      refetchAssets();
    } catch {
      toast.error("No fue posible actualizar");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/activos/${selectedAsset.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible eliminar");
        return;
      }

      toast.success("Activo eliminado");
      setDeleteDialogOpen(false);
      setSelectedAsset(null);
      setSelectedAssetIds((prev) => prev.filter((id) => id !== selectedAsset.id));
      refetchAssets();
    } catch {
      toast.error("No fue posible eliminar");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectedAsset = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const toggleAllFilteredAssets = () => {
    const allVisibleIds = filteredAssets.map((asset) => asset.id);
    const allSelected =
      allVisibleIds.length > 0 && allVisibleIds.every((assetId) => selectedAssetIds.includes(assetId));

    if (allSelected) {
      setSelectedAssetIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
      return;
    }

    setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
  };

  const openBulkDeleteDialog = () => {
    if (selectedAssetIds.length === 0) {
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedAssetIds.length === 0) {
      return;
    }

    try {
      setBulkDeleting(true);

      const results = await Promise.all(
        selectedAssetIds.map(async (assetId) => {
          const response = await fetch(`/api/activos/${assetId}`, { method: "DELETE" });
          return response.ok;
        })
      );

      const successCount = results.filter(Boolean).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} activos eliminados`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} activos no se pudieron eliminar`);
      }

      setSelectedAssetIds([]);
      setBulkDeleteDialogOpen(false);
      refetchAssets();
    } catch {
      toast.error("No fue posible eliminar los activos seleccionados");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkStatusUpdate = async (status: "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED") => {
    if (selectedAssetIds.length === 0) {
      return;
    }

    try {
      setBulkUpdatingStatus(true);
      const results = await Promise.all(
        selectedAssetIds.map(async (assetId) => {
          const response = await fetch(`/api/activos/${assetId}`, {
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
        toast.success(`${successCount} activos actualizados a ${statusConfig[status].label}`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} activos no pudieron actualizarse`);
      }

      refetchAssets();
    } catch {
      toast.error("No fue posible actualizar estado en lote");
    } finally {
      setBulkUpdatingStatus(false);
    }
  };

  const toggleColumn = (column: AssetColumnKey) => {
    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((item) => item !== column);
      }
      return [...prev, column];
    });
  };

  const createViewId = () => `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleSaveCurrentView = () => {
    const name = newViewName.trim();
    if (!name) {
      toast.error("Ingresa un nombre para la vista");
      return;
    }

    const newView: SavedAssetView = {
      id: createViewId(),
      name,
      viewMode,
      searchQuery,
      statusFilter,
      categoryFilter,
    };

    setSavedViews((prev) => [newView, ...prev]);
    setSelectedSavedView(newView.id);
    setNewViewName("");
    setSaveViewDialogOpen(false);
    toast.success("Vista guardada correctamente");
  };

  const applySavedView = (viewId: string) => {
    setSelectedSavedView(viewId);
    if (viewId === "none") {
      return;
    }

    const view = savedViews.find((item) => item.id === viewId);
    if (!view) {
      return;
    }

    setViewMode(view.viewMode);
    setSearchQuery(view.searchQuery);
    setStatusFilter(view.statusFilter);
    setCategoryFilter(view.categoryFilter);
    toast.success(`Vista \"${view.name}\" aplicada`);
  };

  const handleDeleteSavedView = () => {
    if (selectedSavedView === "none") {
      return;
    }

    const view = savedViews.find((item) => item.id === selectedSavedView);
    if (!view) {
      return;
    }

    setSavedViews((prev) => prev.filter((item) => item.id !== view.id));
    setSelectedSavedView("none");
    toast.success(`Vista \"${view.name}\" eliminada`);
  };

  const handleExportCsv = () => {
    const columnToCsv = {
      code: {
        key: "qrCode",
        header: "Codigo",
        map: (asset: Asset) => asset.qrCode || asset.id,
      },
      name: {
        key: "name",
        header: "Nombre",
      },
      category: {
        key: "category",
        header: "Categoria",
        map: (asset: Asset) => asset.category.name,
      },
      status: {
        key: "status",
        header: "Estado",
      },
      value: {
        key: "currentValue",
        header: "Valor Actual",
        map: (asset: Asset) => asset.currentValue,
      },
      owner: {
        key: "securityUser",
        header: "Responsable Seguridad",
        map: (asset: Asset) => `${asset.securityUser.name} ${asset.securityUser.lastName}`,
      },
    } as const;

    downloadCsv(
      filteredAssets,
      selectedColumns.map((columnKey) => columnToCsv[columnKey]),
      `activos-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success("CSV exportado correctamente");
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

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        toggleAllFilteredAssets();
      }

      if (key === "e") {
        event.preventDefault();
        handleExportCsv();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAssets, selectedAssetIds, selectedColumns]);

  if (loadingAssets) {
    return <Loading text="Cargando activos..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <DashboardPageHeader
        eyebrow="Inventario"
        title="Activos"
        description={`${assets.length} activos registrados`}
        actions={
          <>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-4 w-4 mr-2" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columnDefinitions.map((column) => (
                <DropdownMenuItem
                  key={column.key}
                  onSelect={(event) => {
                    event.preventDefault();
                    toggleColumn(column.key);
                  }}
                >
                  <span className="mr-2 inline-flex w-4 justify-center">
                    {selectedColumns.includes(column.key) ? <Check className="h-4 w-4" /> : null}
                  </span>
                  {column.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
          </>
        }
      />

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
            value={selectedSavedView}
            onValueChange={applySavedView}
            placeholder="Vistas"
            items={[
              { value: "none", label: "Vista por defecto" },
              ...savedViews.map((view) => ({ value: view.id, label: view.name })),
            ]}
            className="w-[180px]"
          />
          <Button variant="outline" size="sm" onClick={() => setSaveViewDialogOpen(true)}>
            <Save className="h-4 w-4 mr-2" />
            Guardar vista
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSavedView}
            disabled={selectedSavedView === "none"}
          >
            Eliminar vista
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setCategoryFilter("all");
              setSelectedSavedView("none");
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredAssets.length} de {assets.length} activos
        </p>
        {selectedAssetIds.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-background/95 px-3 py-2 text-sm shadow-lg backdrop-blur md:left-auto md:right-6 md:max-w-fit">
            <span className="font-medium">{selectedAssetIds.length} seleccionados</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate("AVAILABLE")}
              disabled={bulkUpdatingStatus}
            >
              Disponible
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate("MAINTENANCE")}
              disabled={bulkUpdatingStatus}
            >
              Mantenimiento
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusUpdate("RETIRED")}
              disabled={bulkUpdatingStatus}
            >
              Retirar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedAssetIds([])}>
              Limpiar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={openBulkDeleteDialog}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? "Eliminando..." : "Eliminar seleccionados"}
            </Button>
          </div>
        )}
      </div>

      {/* Assets */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No se encontraron activos"
          description="Prueba cambiando filtros o crea un activo nuevo para comenzar a gestionar el inventario."
          actionLabel="Crear activo"
          onAction={() => setDialogOpen(true)}
        />
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
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onChange={() => toggleSelectedAsset(asset.id)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                    />
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(asset)}
                    >
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
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openDeleteDialog(asset)}
                        >
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
          <div className="overflow-x-auto max-h-[65vh]">
            <table className="w-full min-w-[940px]">
              <thead>
                <tr className="border-b bg-muted/60 backdrop-blur-sm">
                  <th className="sticky top-0 text-left p-4 bg-muted/80">
                    <input
                      type="checkbox"
                      checked={
                        filteredAssets.length > 0 &&
                        filteredAssets.every((asset) => selectedAssetIds.includes(asset.id))
                      }
                      onChange={toggleAllFilteredAssets}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                    />
                  </th>
                  {selectedColumns.includes("code") && <th className="sticky top-0 text-left p-4 font-semibold text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/80">Codigo</th>}
                  {selectedColumns.includes("name") && <th className="sticky top-0 text-left p-4 font-semibold text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/80">Nombre</th>}
                  {selectedColumns.includes("category") && <th className="sticky top-0 text-left p-4 font-semibold text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/80">Categoria</th>}
                  {selectedColumns.includes("status") && <th className="sticky top-0 text-left p-4 font-semibold text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/80">Estado</th>}
                  {selectedColumns.includes("value") && <th className="sticky top-0 text-left p-4 font-semibold text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/80">Valor</th>}
                  {selectedColumns.includes("owner") && <th className="sticky top-0 text-left p-4 font-semibold text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/80">Responsable</th>}
                  <th className="sticky top-0 text-right p-4 font-semibold text-xs uppercase tracking-[0.08em] text-muted-foreground bg-muted/80">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, index) => (
                  <tr
                    key={asset.id}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/40",
                      index % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedAssetIds.includes(asset.id)}
                        onChange={() => toggleSelectedAsset(asset.id)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                      />
                    </td>
                    {selectedColumns.includes("code") && <td className="p-4 text-sm font-mono">{asset.qrCode || asset.id.slice(0, 8)}</td>}
                    {selectedColumns.includes("name") && <td className="p-4">
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">{asset.brand} {asset.model}</p>
                    </td>}
                    {selectedColumns.includes("category") && <td className="p-4 text-sm">{asset.category.icon} {asset.category.name}</td>}
                    {selectedColumns.includes("status") && <td className="p-4">
                      <Badge variant={statusConfig[asset.status]?.variant}>
                        {statusConfig[asset.status]?.label}
                      </Badge>
                    </td>}
                    {selectedColumns.includes("value") && <td className="p-4 text-sm font-medium">{formatCurrency(asset.currentValue)}</td>}
                    {selectedColumns.includes("owner") && <td className="p-4 text-sm">{asset.securityUser.name} {asset.securityUser.lastName}</td>}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(asset)}
                        >
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

      <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar vista</DialogTitle>
            <DialogDescription>
              Guarda filtros y modo actual para reutilizarlos rapido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="view-name">Nombre de la vista</Label>
            <Input
              id="view-name"
              placeholder="Ej: Activos en mantenimiento"
              value={newViewName}
              onChange={(event) => setNewViewName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveViewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCurrentView}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar activo</DialogTitle>
            <DialogDescription>Actualiza toda la informacion del activo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <SafeSelect
                  value={editFormData.categoryId}
                  onValueChange={(v) => setEditFormData({ ...editFormData, categoryId: v })}
                  items={categoryOptions}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input
                  value={editFormData.brand}
                  onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input
                  value={editFormData.model}
                  onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numero de serie</Label>
                <Input
                  value={editFormData.serialNumber}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, serialNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Codigo QR</Label>
                <Input
                  value={editFormData.qrCode}
                  onChange={(e) => setEditFormData({ ...editFormData, qrCode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio de compra</Label>
                <Input
                  type="number"
                  value={editFormData.purchasePrice}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, purchasePrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Valor actual</Label>
                <Input
                  type="number"
                  value={editFormData.currentValue}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, currentValue: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ubicacion</Label>
                <Input
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <SafeSelect
                  value={editFormData.status}
                  onValueChange={(v) => setEditFormData({ ...editFormData, status: v })}
                  items={statusOptions.filter((option) => option.value !== "all")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nivel ENS</Label>
                <SafeSelect
                  value={editFormData.ensLevel}
                  onValueChange={(v) => setEditFormData({ ...editFormData, ensLevel: v })}
                  items={[
                    { value: "BASIC", label: "Basico" },
                    { value: "MEDIUM", label: "Medio" },
                    { value: "HIGH", label: "Alto" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>Responsable de seguridad *</Label>
                <SafeSelect
                  value={editFormData.securityUserId}
                  onValueChange={(v) =>
                    setEditFormData({ ...editFormData, securityUserId: v })
                  }
                  items={userOptions}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea
                rows={3}
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditAsset} disabled={actionLoading}>
              {actionLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar activo"
        description={`Se eliminara ${selectedAsset?.name || "este activo"}. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteAsset}
        loading={actionLoading}
      />

      <ConfirmActionDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Eliminar activos seleccionados"
        description={`Se eliminaran ${selectedAssetIds.length} activos seleccionados. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar seleccionados"
        onConfirm={handleBulkDelete}
        loading={bulkDeleting}
      />
    </motion.div>
  );
}
