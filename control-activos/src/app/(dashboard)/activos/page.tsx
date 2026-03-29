"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Cpu,
  HardDrive,
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
  Upload,
  QrCode,
  Columns3,
  Save,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Pin,
  PinOff,
  Shield,
  Laptop,
  LucideIcon,
  Monitor,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeSelect } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import {
  getAssetAttachmentKind,
  getAssetAttachmentLabel,
} from "@/lib/asset-attachments";
import { useFetch } from "@/lib/hooks/use-fetch";
import { downloadCsv } from "@/lib/csv";
import { APP_COMMAND_EVENT, consumePendingAppCommand } from "@/lib/command-bus";
import { uploadFileToServer } from "@/lib/upload-client";
import { cn, formatCurrency as formatEuro } from "@/lib/utils";
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
  photos: {
    id: string;
    url: string;
    isPrimary: boolean;
    caption: string | null;
    uploadedAt: string;
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

interface AssetImportPreviewRow {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  fields: {
    name: string;
    category: string;
    securityEmail: string;
    status: string;
    ensLevel: string;
    brand: string;
    model: string;
    serialNumber: string;
    qrCode: string;
    location: string;
    purchasePrice: string;
    currentValue: string;
    purchaseDate: string;
    description: string;
  };
}

interface AssetImportPreviewResponse {
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    canImport: boolean;
  };
  rows: AssetImportPreviewRow[];
}

const statusConfig: Record<
  string,
  { label: string; variant: "success" | "info" | "warning" | "destructive" | "secondary" }
> = {
  AVAILABLE: { label: "Disponible", variant: "success" },
  ASSIGNED: { label: "Asignado", variant: "secondary" },
  MAINTENANCE: { label: "Mantenimiento", variant: "info" },
  RETIRED: { label: "Dado de baja", variant: "destructive" },
};

const categoryIconByKeyword: { matcher: RegExp; icon: LucideIcon }[] = [
  { matcher: /(laptop|notebook)/i, icon: Laptop },
  { matcher: /(monitor|pantalla)/i, icon: Monitor },
  { matcher: /(server|servidor)/i, icon: Server },
  { matcher: /(disco|almacen|storage|ssd|hdd)/i, icon: HardDrive },
  { matcher: /(cpu|procesador|equipo|desktop)/i, icon: Cpu },
  { matcher: /(seguridad|security|firewall)/i, icon: Shield },
];

function getCategoryIcon(categoryName: string): LucideIcon {
  return (
    categoryIconByKeyword.find(({ matcher }) => matcher.test(categoryName))?.icon ??
    Package
  );
}

function getPrimaryAssetPhoto(photos: Asset["photos"]): Asset["photos"][number] | null {
  const imageAttachments = photos.filter(
    (attachment) => getAssetAttachmentKind(attachment.caption, attachment.url) === "PHOTO"
  );

  return imageAttachments.find((attachment) => attachment.isPrimary) ?? imageAttachments[0] ?? null;
}

function AssetsLoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando activos</span>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
        <div className="mt-4 h-8 w-48 animate-pulse rounded bg-muted/70" />
        <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-muted/70" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="h-11 animate-pulse rounded-lg bg-muted/70 sm:col-span-2 xl:col-span-2" />
          <div className="h-11 animate-pulse rounded-lg bg-muted/70" />
          <div className="h-11 animate-pulse rounded-lg bg-muted/70" />
          <div className="h-11 animate-pulse rounded-lg bg-muted/70" />
          <div className="h-11 animate-pulse rounded-lg bg-muted/70" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-[1fr_2fr_1.6fr_1.3fr_1.4fr_1.4fr] gap-3 border-b border-border pb-3">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <div key={index} className="h-3 animate-pulse rounded bg-muted/70" />
          ))}
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((index) => (
            <div key={index} className="grid grid-cols-[1fr_2fr_1.6fr_1.3fr_1.4fr_1.4fr] gap-3">
              {[1, 2, 3, 4, 5, 6].map((cell) => (
                <div key={cell} className="h-4 animate-pulse rounded bg-muted/70" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const columnDefinitions = [
  { key: "code", label: "Codigo" },
  { key: "name", label: "Nombre" },
  { key: "category", label: "Categoria" },
  { key: "status", label: "Estado" },
  { key: "value", label: "Valor" },
  { key: "owner", label: "Responsable" },
] as const;

type AssetColumnKey = (typeof columnDefinitions)[number]["key"];

type SortField = "name" | "category" | "status" | "currentValue" | "owner";
type SortDirection = "asc" | "desc";
type TableDensity = "compact" | "default" | "comfortable";

const CHECKBOX_COLUMN_WIDTH = 56;

const COLUMN_WIDTHS: Record<AssetColumnKey, number> = {
  code: 150,
  name: 280,
  category: 220,
  status: 170,
  value: 170,
  owner: 220,
};

const sortFieldOptions: { value: SortField; label: string }[] = [
  { value: "name", label: "Nombre" },
  { value: "category", label: "Categoria" },
  { value: "status", label: "Estado" },
  { value: "currentValue", label: "Valor" },
  { value: "owner", label: "Responsable" },
];

const densityOptions: { value: TableDensity; label: string }[] = [
  { value: "compact", label: "Compacta" },
  { value: "default", label: "Estándar" },
  { value: "comfortable", label: "Espaciosa" },
];

interface SavedAssetView {
  id: string;
  name: string;
  viewMode: "grid" | "list";
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
  ensFilter: string;
  ownerFilter: string;
  valueMin: string;
  valueMax: string;
  tableDensity: TableDensity;
  primarySortField: SortField;
  primarySortDirection: SortDirection;
  secondarySortField: SortField | "none";
  secondarySortDirection: SortDirection;
}

export default function ActivosPage() {
  const FILTERS_STORAGE_KEY = "activos.filters.v1";
  const VIEWS_STORAGE_KEY = "activos.saved-views.v1";

  const { data: assets, loading: loadingAssets, refetch: refetchAssets } = useFetch<Asset[]>("/api/activos", []);
  const { data: categories } = useFetch<Category[]>("/api/categorias?view=options", []);
  const { data: users } = useFetch<User[]>("/api/usuarios?view=options", []);

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [ensFilter, setEnsFilter] = React.useState("all");
  const [ownerFilter, setOwnerFilter] = React.useState("all");
  const [valueMin, setValueMin] = React.useState("");
  const [valueMax, setValueMax] = React.useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [tableDensity, setTableDensity] = React.useState<TableDensity>("default");
  const [primarySortField, setPrimarySortField] = React.useState<SortField>("name");
  const [primarySortDirection, setPrimarySortDirection] = React.useState<SortDirection>("asc");
  const [secondarySortField, setSecondarySortField] = React.useState<SortField | "none">("none");
  const [secondarySortDirection, setSecondarySortDirection] = React.useState<SortDirection>("asc");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = React.useState<Asset | null>(null);
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
  const [pinnedColumns, setPinnedColumns] = React.useState<AssetColumnKey[]>(["code"]);
  const [savedViews, setSavedViews] = React.useState<SavedAssetView[]>([]);
  const [selectedSavedView, setSelectedSavedView] = React.useState("none");
  const [saveViewDialogOpen, setSaveViewDialogOpen] = React.useState(false);
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importCsvContent, setImportCsvContent] = React.useState("");
  const [importPreview, setImportPreview] = React.useState<AssetImportPreviewResponse | null>(null);
  const [previewingImport, setPreviewingImport] = React.useState(false);
  const [importingFromCsv, setImportingFromCsv] = React.useState(false);
  const [newViewName, setNewViewName] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 24;
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
  const [assetPhotoFile, setAssetPhotoFile] = React.useState<File | null>(null);
  const [assetInvoiceFile, setAssetInvoiceFile] = React.useState<File | null>(null);
  const [uploadingAssetPhoto, setUploadingAssetPhoto] = React.useState(false);
  const [uploadingAssetInvoice, setUploadingAssetInvoice] = React.useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = React.useState<string | null>(null);
  const [settingPrimaryAttachmentId, setSettingPrimaryAttachmentId] = React.useState<string | null>(
    null
  );

  const resetForm = React.useCallback(() => {
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
  }, []);

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
          ensFilter?: string;
          ownerFilter?: string;
          valueMin?: string;
          valueMax?: string;
          tableDensity?: TableDensity;
          primarySortField?: SortField;
          primarySortDirection?: SortDirection;
          secondarySortField?: SortField | "none";
          secondarySortDirection?: SortDirection;
          selectedColumns?: AssetColumnKey[];
          pinnedColumns?: AssetColumnKey[];
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
        if (typeof parsed.ensFilter === "string") {
          setEnsFilter(parsed.ensFilter);
        }
        if (typeof parsed.ownerFilter === "string") {
          setOwnerFilter(parsed.ownerFilter);
        }
        if (typeof parsed.valueMin === "string") {
          setValueMin(parsed.valueMin);
        }
        if (typeof parsed.valueMax === "string") {
          setValueMax(parsed.valueMax);
        }
        if (
          parsed.tableDensity === "compact" ||
          parsed.tableDensity === "default" ||
          parsed.tableDensity === "comfortable"
        ) {
          setTableDensity(parsed.tableDensity);
        }
        if (sortFieldOptions.some((option) => option.value === parsed.primarySortField)) {
          setPrimarySortField(parsed.primarySortField as SortField);
        }
        if (parsed.primarySortDirection === "asc" || parsed.primarySortDirection === "desc") {
          setPrimarySortDirection(parsed.primarySortDirection);
        }
        if (
          parsed.secondarySortField === "none" ||
          sortFieldOptions.some((option) => option.value === parsed.secondarySortField)
        ) {
          setSecondarySortField((parsed.secondarySortField as SortField | "none") || "none");
        }
        if (parsed.secondarySortDirection === "asc" || parsed.secondarySortDirection === "desc") {
          setSecondarySortDirection(parsed.secondarySortDirection);
        }
        if (Array.isArray(parsed.selectedColumns) && parsed.selectedColumns.length > 0) {
          const validColumns = parsed.selectedColumns.filter((column): column is AssetColumnKey =>
            columnDefinitions.some((definition) => definition.key === column)
          );
          if (validColumns.length > 0) {
            setSelectedColumns(validColumns);
          }
        }
        if (Array.isArray(parsed.pinnedColumns)) {
          const validPinnedColumns = parsed.pinnedColumns.filter((column): column is AssetColumnKey =>
            columnDefinitions.some((definition) => definition.key === column)
          );
          setPinnedColumns(validPinnedColumns);
        }
      }

      const rawViews = localStorage.getItem(VIEWS_STORAGE_KEY);
      if (rawViews) {
        const parsedViews = JSON.parse(rawViews) as SavedAssetView[];
        if (Array.isArray(parsedViews)) {
          setSavedViews(
            parsedViews.map((view) => ({
              ...view,
              ensFilter: view.ensFilter || "all",
              ownerFilter: view.ownerFilter || "all",
              valueMin: typeof view.valueMin === "string" ? view.valueMin : "",
              valueMax: typeof view.valueMax === "string" ? view.valueMax : "",
              tableDensity: view.tableDensity || "default",
              primarySortField: view.primarySortField || "name",
              primarySortDirection: view.primarySortDirection || "asc",
              secondarySortField: view.secondarySortField || "none",
              secondarySortDirection: view.secondarySortDirection || "asc",
            }))
          );
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
        ensFilter,
        ownerFilter,
        valueMin,
        valueMax,
        tableDensity,
        primarySortField,
        primarySortDirection,
        secondarySortField,
        secondarySortDirection,
        selectedColumns,
        pinnedColumns,
      })
    );
    localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
  }, [
    viewMode,
    searchQuery,
    statusFilter,
    categoryFilter,
    ensFilter,
    ownerFilter,
    valueMin,
    valueMax,
    tableDensity,
    primarySortField,
    primarySortDirection,
    secondarySortField,
    secondarySortDirection,
    selectedColumns,
    pinnedColumns,
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

  const openDetailDialog = (asset: Asset) => {
    setDetailAsset(asset);
    setDetailDialogOpen(true);
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
    const allVisibleIds = paginatedAssets.map((asset) => asset.id);
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
        setPinnedColumns((pinned) => pinned.filter((item) => item !== column));
        return prev.filter((item) => item !== column);
      }
      return [...prev, column];
    });
  };

  const togglePinnedColumn = (column: AssetColumnKey) => {
    if (!selectedColumns.includes(column)) {
      return;
    }

    setPinnedColumns((prev) =>
      prev.includes(column) ? prev.filter((item) => item !== column) : [...prev, column]
    );
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
      ensFilter,
      ownerFilter,
      valueMin,
      valueMax,
      tableDensity,
      primarySortField,
      primarySortDirection,
      secondarySortField,
      secondarySortDirection,
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
    setEnsFilter(view.ensFilter);
    setOwnerFilter(view.ownerFilter);
    setValueMin(view.valueMin);
    setValueMax(view.valueMax);
    setTableDensity(view.tableDensity);
    setPrimarySortField(view.primarySortField);
    setPrimarySortDirection(view.primarySortDirection);
    setSecondarySortField(view.secondarySortField);
    setSecondarySortDirection(view.secondarySortDirection);
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
      sortedAssets,
      selectedColumns.map((columnKey) => columnToCsv[columnKey]),
      `activos-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success("CSV exportado correctamente");
  };

  const handleExportCsvRef = React.useRef(handleExportCsv);
  handleExportCsvRef.current = handleExportCsv;

  const handleDownloadImportTemplate = () => {
    const template = [
      "nombre,categoria,responsable_email,estado,nivel_ens,marca,modelo,serial,codigo_qr,ubicacion,descripcion,precio_compra,valor_actual,fecha_compra",
      "Laptop Dell XPS 15,Laptops,admin@empresa.com,AVAILABLE,BASIC,Dell,XPS 15,DLXPS-0001,QR-DLXPS-0001,Oficina central,Equipo de pruebas,2400,2200,2026-01-15",
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-importacion-activos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateImportPreview = async () => {
    if (!importFile) {
      toast.error("Selecciona un archivo CSV");
      return;
    }

    if (!importFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("El archivo debe ser .csv");
      return;
    }

    try {
      setPreviewingImport(true);
      const csvContent = await importFile.text();

      const response = await fetch("/api/activos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent,
          commit: false,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok || !body) {
        toast.error(body?.error ?? "No fue posible validar el archivo");
        return;
      }

      setImportCsvContent(csvContent);
      setImportPreview(body as AssetImportPreviewResponse);

      if (body.summary.invalidRows > 0) {
        toast("Se detectaron filas con errores");
      } else {
        toast.success("Archivo validado correctamente");
      }
    } catch {
      toast.error("No fue posible validar el archivo");
    } finally {
      setPreviewingImport(false);
    }
  };

  const handleImportAssetsFromCsv = async () => {
    if (!importPreview) {
      toast.error("Primero valida el archivo");
      return;
    }

    if (!importPreview.summary.canImport) {
      toast.error("Corrige los errores antes de importar");
      return;
    }

    try {
      setImportingFromCsv(true);

      const response = await fetch("/api/activos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: importCsvContent,
          commit: true,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok || !body) {
        setImportPreview((body as AssetImportPreviewResponse) || importPreview);
        toast.error(body?.error ?? "No fue posible importar el archivo");
        return;
      }

      toast.success(`Importacion completada: ${body.createdCount} activos`);
      setImportDialogOpen(false);
      setImportFile(null);
      setImportCsvContent("");
      setImportPreview(null);
      refetchAssets();
    } catch {
      toast.error("No fue posible importar el archivo");
    } finally {
      setImportingFromCsv(false);
    }
  };

  const handleExportSingleAssetCsv = (asset: Asset) => {
    downloadCsv(
      [asset],
      [
        { key: "name", header: "Nombre" },
        { key: "qrCode", header: "Codigo", map: (item: Asset) => item.qrCode || item.id },
        { key: "status", header: "Estado" },
        { key: "brand", header: "Marca", map: (item: Asset) => item.brand || "" },
        { key: "model", header: "Modelo", map: (item: Asset) => item.model || "" },
        { key: "category", header: "Categoria", map: (item: Asset) => item.category.name },
        {
          key: "securityUser",
          header: "Responsable Seguridad",
          map: (item: Asset) => `${item.securityUser.name} ${item.securityUser.lastName}`,
        },
        {
          key: "currentValue",
          header: "Valor Actual",
          map: (item: Asset) => item.currentValue,
        },
      ],
      `activo-${asset.qrCode || asset.id.slice(0, 8)}.csv`
    );
    toast.success(`Activo ${asset.name} exportado`);
  };

  const handleUploadAssetAttachment = async (kind: "PHOTO" | "INVOICE") => {
    if (!detailAsset) {
      return;
    }

    const targetFile = kind === "PHOTO" ? assetPhotoFile : assetInvoiceFile;
    if (!targetFile) {
      toast.error(kind === "PHOTO" ? "Selecciona una foto" : "Selecciona una factura");
      return;
    }

    if (kind === "PHOTO") {
      setUploadingAssetPhoto(true);
    } else {
      setUploadingAssetInvoice(true);
    }

    try {
      const upload = await uploadFileToServer(
        targetFile,
        kind === "PHOTO" ? "asset-photos" : "asset-invoices"
      );

      const response = await fetch(`/api/activos/${detailAsset.id}/adjuntos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          fileUrl: upload.fileUrl,
          fileName: upload.fileName,
          isPrimary: kind === "PHOTO" && detailAsset.photos.length === 0,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok || !body) {
        toast.error(body?.error ?? "No fue posible guardar el adjunto");
        return;
      }

      setDetailAsset((prev) => {
        if (!prev) {
          return prev;
        }

        const nextPhotos = body.isPrimary
          ? prev.photos.map((photo) => ({ ...photo, isPrimary: false }))
          : prev.photos;

        return {
          ...prev,
          photos: [
            {
              id: body.id,
              url: body.url,
              caption: body.caption,
              isPrimary: body.isPrimary,
              uploadedAt: body.uploadedAt,
            },
            ...nextPhotos,
          ],
        };
      });

      refetchAssets();

      if (kind === "PHOTO") {
        setAssetPhotoFile(null);
      } else {
        setAssetInvoiceFile(null);
      }

      toast.success(kind === "PHOTO" ? "Foto cargada" : "Factura cargada");
    } catch {
      toast.error("No fue posible subir el archivo");
    } finally {
      if (kind === "PHOTO") {
        setUploadingAssetPhoto(false);
      } else {
        setUploadingAssetInvoice(false);
      }
    }
  };

  const handleDeleteAssetAttachment = async (attachmentId: string) => {
    if (!detailAsset) {
      return;
    }

    try {
      setDeletingAttachmentId(attachmentId);
      const response = await fetch(
        `/api/activos/${detailAsset.id}/adjuntos/${attachmentId}`,
        { method: "DELETE" }
      );

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "No fue posible eliminar el adjunto");
        return;
      }

      setDetailAsset((prev) =>
        prev
          ? {
              ...prev,
              photos: prev.photos.filter((attachment) => attachment.id !== attachmentId),
            }
          : prev
      );
      refetchAssets();
      toast.success("Adjunto eliminado");
    } catch {
      toast.error("No fue posible eliminar el adjunto");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const handleSetPrimaryAssetPhoto = async (attachmentId: string) => {
    if (!detailAsset) {
      return;
    }

    try {
      setSettingPrimaryAttachmentId(attachmentId);
      const response = await fetch(
        `/api/activos/${detailAsset.id}/adjuntos/${attachmentId}`,
        { method: "PATCH" }
      );

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "No fue posible actualizar la foto principal");
        return;
      }

      setDetailAsset((prev) =>
        prev
          ? {
              ...prev,
              photos: prev.photos.map((attachment) => {
                if (getAssetAttachmentKind(attachment.caption, attachment.url) !== "PHOTO") {
                  return attachment;
                }

                return {
                  ...attachment,
                  isPrimary: attachment.id === attachmentId,
                };
              }),
            }
          : prev
      );

      refetchAssets();
      toast.success("Foto principal actualizada");
    } catch {
      toast.error("No fue posible actualizar la foto principal");
    } finally {
      setSettingPrimaryAttachmentId(null);
    }
  };

  const detailPhotoAttachments = React.useMemo(
    () =>
      (detailAsset?.photos || []).filter(
        (attachment) => getAssetAttachmentKind(attachment.caption, attachment.url) === "PHOTO"
      ),
    [detailAsset]
  );

  const detailInvoiceAttachments = React.useMemo(
    () =>
      (detailAsset?.photos || []).filter(
        (attachment) => getAssetAttachmentKind(attachment.caption, attachment.url) === "INVOICE"
      ),
    [detailAsset]
  );

  const detailPrimaryPhoto = React.useMemo(
    () => detailPhotoAttachments.find((attachment) => attachment.isPrimary) ?? detailPhotoAttachments[0] ?? null,
    [detailPhotoAttachments]
  );

  React.useEffect(() => {
    const executeQuickCommand = (command: string) => {
      if (command === "new-asset") {
        resetForm();
        setDialogOpen(true);
      }

      if (command === "export-assets") {
        handleExportCsvRef.current();
      }

      if (command === "import-assets") {
        setImportDialogOpen(true);
      }
    };

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
  }, [resetForm]);

  const filteredAssets = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const minValue = valueMin.trim() === "" ? null : Number(valueMin);
    const maxValue = valueMax.trim() === "" ? null : Number(valueMax);

    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(normalizedQuery) ||
        (asset.serialNumber?.toLowerCase().includes(normalizedQuery) ?? false) ||
        (asset.qrCode?.toLowerCase().includes(normalizedQuery) ?? false);

      const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || asset.category.id === categoryFilter;
      const matchesEns = ensFilter === "all" || asset.ensLevel === ensFilter;
      const matchesOwner = ownerFilter === "all" || asset.securityUser.id === ownerFilter;

      const currentValue = asset.currentValue ?? 0;
      const matchesMin = minValue === null || Number.isNaN(minValue) ? true : currentValue >= minValue;
      const matchesMax = maxValue === null || Number.isNaN(maxValue) ? true : currentValue <= maxValue;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesEns &&
        matchesOwner &&
        matchesMin &&
        matchesMax
      );
    });
  }, [
    assets,
    searchQuery,
    statusFilter,
    categoryFilter,
    ensFilter,
    ownerFilter,
    valueMin,
    valueMax,
  ]);

  const sortedAssets = React.useMemo(() => {
    const getSortValue = (asset: Asset, field: SortField) => {
      if (field === "name") {
        return asset.name.toLowerCase();
      }
      if (field === "category") {
        return asset.category.name.toLowerCase();
      }
      if (field === "status") {
        return asset.status.toLowerCase();
      }
      if (field === "currentValue") {
        return asset.currentValue ?? 0;
      }
      return `${asset.securityUser.name} ${asset.securityUser.lastName}`.toLowerCase();
    };

    const sortRules: { field: SortField; direction: SortDirection }[] = [
      { field: primarySortField, direction: primarySortDirection },
    ];

    if (secondarySortField !== "none" && secondarySortField !== primarySortField) {
      sortRules.push({ field: secondarySortField, direction: secondarySortDirection });
    }

    const sorted = [...filteredAssets].sort((a, b) => {
      for (const rule of sortRules) {
        const left = getSortValue(a, rule.field);
        const right = getSortValue(b, rule.field);

        if (typeof left === "number" && typeof right === "number") {
          if (left !== right) {
            return rule.direction === "asc" ? left - right : right - left;
          }
          continue;
        }

        const comparison = String(left).localeCompare(String(right), "es", {
          sensitivity: "base",
          numeric: true,
        });

        if (comparison !== 0) {
          return rule.direction === "asc" ? comparison : -comparison;
        }
      }

      return a.name.localeCompare(b.name, "es", { sensitivity: "base", numeric: true });
    });

    return sorted;
  }, [
    filteredAssets,
    primarySortField,
    primarySortDirection,
    secondarySortField,
    secondarySortDirection,
  ]);

  const activePinnedColumns = React.useMemo(
    () => pinnedColumns.filter((column) => selectedColumns.includes(column)),
    [pinnedColumns, selectedColumns]
  );

  const getPinnedOffset = React.useCallback(
    (column: AssetColumnKey) => {
      let offset = CHECKBOX_COLUMN_WIDTH;

      for (const pinnedColumn of activePinnedColumns) {
        if (pinnedColumn === column) {
          break;
        }
        offset += COLUMN_WIDTHS[pinnedColumn];
      }

      return offset;
    },
    [activePinnedColumns]
  );

  const densityConfig = React.useMemo(() => {
    if (tableDensity === "compact") {
      return {
        headerPadding: "px-4 py-3",
        cellPadding: "px-4 py-3",
        textSize: "text-xs",
        actionSize: "h-7 w-7",
      };
    }

    if (tableDensity === "comfortable") {
      return {
        headerPadding: "px-6 py-5",
        cellPadding: "px-6 py-5",
        textSize: "text-sm",
        actionSize: "h-9 w-9",
      };
    }

    return {
      headerPadding: "px-5 py-4",
      cellPadding: "px-5 py-4",
      textSize: "text-sm",
      actionSize: "h-8 w-8",
    };
  }, [tableDensity]);

  const totalPages = Math.max(1, Math.ceil(sortedAssets.length / ITEMS_PER_PAGE));

  const paginatedAssets = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAssets, currentPage]);

  const firstVisibleIndex = sortedAssets.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const lastVisibleIndex = Math.min(currentPage * ITEMS_PER_PAGE, sortedAssets.length);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    ensFilter,
    ownerFilter,
    valueMin,
    valueMax,
    primarySortField,
    primarySortDirection,
    secondarySortField,
    secondarySortDirection,
  ]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return formatEuro(value);
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

  const ensOptions = [
    { value: "all", label: "Todos los niveles" },
    { value: "BASIC", label: "Basico" },
    { value: "MEDIUM", label: "Medio" },
    { value: "HIGH", label: "Alto" },
  ];

  const sortDirectionOptions = [
    { value: "asc", label: "Ascendente" },
    { value: "desc", label: "Descendente" },
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
    return <AssetsLoadingSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
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
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-4 w-4 mr-2" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
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
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Fijar columnas</DropdownMenuLabel>
              {columnDefinitions.map((column) => (
                <DropdownMenuItem
                  key={`pin-${column.key}`}
                  onSelect={(event) => {
                    event.preventDefault();
                    togglePinnedColumn(column.key);
                  }}
                  disabled={!selectedColumns.includes(column.key)}
                >
                  <span className="mr-2 inline-flex w-4 justify-center">
                    {activePinnedColumns.includes(column.key) ? (
                      <Pin className="h-4 w-4" />
                    ) : (
                      <PinOff className="h-4 w-4" />
                    )}
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
                <div className="grid gap-4 md:grid-cols-2">
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
                <div className="grid gap-4 md:grid-cols-2">
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
                <div className="grid gap-4 md:grid-cols-2">
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
                <div className="grid gap-4 md:grid-cols-2">
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
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar activos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <SafeSelect
                value={selectedSavedView}
                onValueChange={applySavedView}
                placeholder="Vistas"
                items={[
                  { value: "none", label: "Vista por defecto" },
                  ...savedViews.map((view) => ({ value: view.id, label: view.name })),
                ]}
                className="w-[190px]"
              />

              <Button variant="outline" size="sm" onClick={() => setSaveViewDialogOpen(true)}>
                <Save className="mr-2 h-4 w-4" />
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
                  setEnsFilter("all");
                  setOwnerFilter("all");
                  setValueMin("");
                  setValueMax("");
                  setTableDensity("default");
                  setPrimarySortField("name");
                  setPrimarySortDirection("asc");
                  setSecondarySortField("none");
                  setSecondarySortDirection("asc");
                  setSelectedSavedView("none");
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>

              <div className="flex items-center rounded-lg border border-border bg-secondary p-0.5">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters((current) => !current)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtros avanzados
              </Button>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[repeat(6,minmax(0,1fr))]">
            <SafeSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="Estado"
              items={statusOptions}
            />

            <SafeSelect
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              placeholder="Categoria"
              items={[{ value: "all", label: "Todas" }, ...categoryOptions]}
            />

            <SafeSelect
              value={primarySortField}
              onValueChange={(value) => setPrimarySortField(value as SortField)}
              placeholder="Orden principal"
              items={sortFieldOptions}
            />

            <SafeSelect
              value={primarySortDirection}
              onValueChange={(value) => setPrimarySortDirection(value as SortDirection)}
              placeholder="Direccion"
              items={sortDirectionOptions}
            />

            <SafeSelect
              value={secondarySortField}
              onValueChange={(value) => setSecondarySortField(value as SortField | "none")}
              placeholder="Orden secundario"
              items={[{ value: "none", label: "Sin orden secundario" }, ...sortFieldOptions]}
            />

            <SafeSelect
              value={tableDensity}
              onValueChange={(value) => setTableDensity(value as TableDensity)}
              placeholder="Densidad"
              items={densityOptions}
            />
          </div>

          {showAdvancedFilters ? (
            <div className="grid gap-3 border-t border-border pt-3 md:grid-cols-2 xl:grid-cols-5">
              <SafeSelect
                value={ensFilter}
                onValueChange={setEnsFilter}
                placeholder="Nivel ENS"
                items={ensOptions}
              />

              <SafeSelect
                value={ownerFilter}
                onValueChange={setOwnerFilter}
                placeholder="Responsable"
                items={[{ value: "all", label: "Todos" }, ...userOptions]}
              />

              <SafeSelect
                value={secondarySortDirection}
                onValueChange={(value) => setSecondarySortDirection(value as SortDirection)}
                placeholder="Direccion secundaria"
                items={sortDirectionOptions}
              />

              <Input
                type="number"
                placeholder="Valor minimo"
                value={valueMin}
                onChange={(event) => setValueMin(event.target.value)}
              />

              <Input
                type="number"
                placeholder="Valor maximo"
                value={valueMax}
                onChange={(event) => setValueMax(event.target.value)}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm tracking-[0.01em] text-muted-foreground">
          Mostrando {firstVisibleIndex}-{lastVisibleIndex} de {sortedAssets.length} activos
        </p>
        {selectedAssetIds.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 px-3.5 py-2.5 text-sm shadow-[0_24px_40px_-30px_rgba(0,0,0,0.9)] backdrop-blur md:left-auto md:right-6 md:max-w-fit">
            <span className="font-medium tracking-[0.01em]">{selectedAssetIds.length} seleccionados</span>
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
      {sortedAssets.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No se encontraron activos"
          description="Prueba cambiando filtros o crea un activo nuevo para comenzar a gestionar el inventario."
          actionLabel="Crear activo"
          onAction={() => setDialogOpen(true)}
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedAssets.map((asset, index) => {
            const CategoryIcon = getCategoryIcon(asset.category.name);
            const primaryPhoto = getPrimaryAssetPhoto(asset.photos);

            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className="group overflow-hidden border-border transition-all duration-200 ease-in-out hover:border-border hover:shadow-[0_24px_36px_-32px_rgba(0,0,0,0.95)]">
                  <div className="relative flex h-48 items-center justify-center border-b border-border bg-[linear-gradient(160deg,#111111_0%,#0d0d0d_100%)]">
                    {primaryPhoto ? (
                      <>
                        <Image
                          src={primaryPhoto.url}
                          alt={`Foto de ${asset.name}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-200 ease-in-out group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10" />
                      </>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary transition-transform duration-200 ease-in-out group-hover:scale-[1.03]">
                        <CategoryIcon className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      variant={statusConfig[asset.status]?.variant ?? "secondary"}
                      className="absolute right-4 top-4 backdrop-blur-sm"
                    >
                      {statusConfig[asset.status]?.label ?? asset.status}
                    </Badge>
                    {asset.qrCode ? (
                      <Badge variant="outline" className="absolute bottom-4 left-4 backdrop-blur-sm">
                        <QrCode className="mr-1.5 h-3 w-3" />
                        {asset.qrCode}
                      </Badge>
                    ) : null}
                  </div>

                  <CardContent className="space-y-4 p-5">
                    <div>
                      <h3 className="line-clamp-1 text-lg font-semibold tracking-[-0.01em]">{asset.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {asset.brand ?? "Sin marca"} {asset.model ? `• ${asset.model}` : ""}
                      </p>
                    </div>

                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CategoryIcon className="h-4 w-4" />
                        <span className="text-foreground">{asset.category.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span className="text-foreground">
                          {asset.securityUser.name} {asset.securityUser.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Cpu className="h-4 w-4" />
                        <span className="font-medium text-foreground">{formatCurrency(asset.currentValue)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t border-border pt-4">
                      <input
                        type="checkbox"
                        checked={selectedAssetIds.includes(asset.id)}
                        onChange={() => toggleSelectedAsset(asset.id)}
                        className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/40"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDetailDialog(asset)}
                      >
                        <Eye className="mr-1.5 h-4 w-4" /> Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(asset)}
                      >
                        <Edit className="mr-1.5 h-4 w-4" /> Editar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileDown className="mr-2 h-4 w-4" /> PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => openDeleteDialog(asset)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden border-border">
          <div className="max-h-[68vh] overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1180px]">
              <thead>
                <tr className="border-b border-border bg-card/95">
                  <th
                    className={cn(
                      "sticky left-0 top-0 z-30 bg-card text-left",
                      densityConfig.headerPadding
                    )}
                    style={{
                      width: `${CHECKBOX_COLUMN_WIDTH}px`,
                      minWidth: `${CHECKBOX_COLUMN_WIDTH}px`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        paginatedAssets.length > 0 &&
                        paginatedAssets.every((asset) => selectedAssetIds.includes(asset.id))
                      }
                      onChange={toggleAllFilteredAssets}
                      className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/40"
                    />
                  </th>
                  {selectedColumns.includes("code") ? (
                    <th
                      className={cn(
                        "sticky top-0 bg-card text-left text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground",
                        densityConfig.headerPadding,
                        activePinnedColumns.includes("code") &&
                          "z-30 border-r border-border shadow-[1px_0_0_0_rgba(26,26,26,0.95)]"
                      )}
                      style={{
                        width: `${COLUMN_WIDTHS.code}px`,
                        minWidth: `${COLUMN_WIDTHS.code}px`,
                        left: activePinnedColumns.includes("code")
                          ? `${getPinnedOffset("code")}px`
                          : undefined,
                      }}
                    >
                      Codigo
                    </th>
                  ) : null}
                  {selectedColumns.includes("name") ? (
                    <th
                      className={cn(
                        "sticky top-0 bg-card text-left text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground",
                        densityConfig.headerPadding,
                        activePinnedColumns.includes("name") &&
                          "z-30 border-r border-border shadow-[1px_0_0_0_rgba(26,26,26,0.95)]"
                      )}
                      style={{
                        width: `${COLUMN_WIDTHS.name}px`,
                        minWidth: `${COLUMN_WIDTHS.name}px`,
                        left: activePinnedColumns.includes("name")
                          ? `${getPinnedOffset("name")}px`
                          : undefined,
                      }}
                    >
                      Nombre
                    </th>
                  ) : null}
                  {selectedColumns.includes("category") ? (
                    <th
                      className={cn(
                        "sticky top-0 bg-card text-left text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground",
                        densityConfig.headerPadding,
                        activePinnedColumns.includes("category") &&
                          "z-30 border-r border-border shadow-[1px_0_0_0_rgba(26,26,26,0.95)]"
                      )}
                      style={{
                        width: `${COLUMN_WIDTHS.category}px`,
                        minWidth: `${COLUMN_WIDTHS.category}px`,
                        left: activePinnedColumns.includes("category")
                          ? `${getPinnedOffset("category")}px`
                          : undefined,
                      }}
                    >
                      Categoria
                    </th>
                  ) : null}
                  {selectedColumns.includes("status") ? (
                    <th
                      className={cn(
                        "sticky top-0 bg-card text-left text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground",
                        densityConfig.headerPadding,
                        activePinnedColumns.includes("status") &&
                          "z-30 border-r border-border shadow-[1px_0_0_0_rgba(26,26,26,0.95)]"
                      )}
                      style={{
                        width: `${COLUMN_WIDTHS.status}px`,
                        minWidth: `${COLUMN_WIDTHS.status}px`,
                        left: activePinnedColumns.includes("status")
                          ? `${getPinnedOffset("status")}px`
                          : undefined,
                      }}
                    >
                      Estado
                    </th>
                  ) : null}
                  {selectedColumns.includes("value") ? (
                    <th
                      className={cn(
                        "sticky top-0 bg-card text-left text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground",
                        densityConfig.headerPadding,
                        activePinnedColumns.includes("value") &&
                          "z-30 border-r border-border shadow-[1px_0_0_0_rgba(26,26,26,0.95)]"
                      )}
                      style={{
                        width: `${COLUMN_WIDTHS.value}px`,
                        minWidth: `${COLUMN_WIDTHS.value}px`,
                        left: activePinnedColumns.includes("value")
                          ? `${getPinnedOffset("value")}px`
                          : undefined,
                      }}
                    >
                      Valor
                    </th>
                  ) : null}
                  {selectedColumns.includes("owner") ? (
                    <th
                      className={cn(
                        "sticky top-0 bg-card text-left text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground",
                        densityConfig.headerPadding,
                        activePinnedColumns.includes("owner") &&
                          "z-30 border-r border-border shadow-[1px_0_0_0_rgba(26,26,26,0.95)]"
                      )}
                      style={{
                        width: `${COLUMN_WIDTHS.owner}px`,
                        minWidth: `${COLUMN_WIDTHS.owner}px`,
                        left: activePinnedColumns.includes("owner")
                          ? `${getPinnedOffset("owner")}px`
                          : undefined,
                      }}
                    >
                      Responsable
                    </th>
                  ) : null}
                  <th
                    className={cn(
                      "sticky top-0 bg-card text-right text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground",
                      densityConfig.headerPadding
                    )}
                    style={{ width: "130px", minWidth: "130px" }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedAssets.map((asset) => {
                  const CategoryIcon = getCategoryIcon(asset.category.name);
                  const primaryPhoto = getPrimaryAssetPhoto(asset.photos);

                  return (
                    <tr
                      key={asset.id}
                      className={cn(
                        "group border-b border-border/90 transition-all duration-200 ease-in-out hover:bg-accent/70",
                        densityConfig.textSize
                      )}
                    >
                      <td
                        className={cn(
                          "sticky left-0 z-20 bg-card/95 align-middle group-hover:bg-accent/70",
                          densityConfig.cellPadding
                        )}
                        style={{
                          width: `${CHECKBOX_COLUMN_WIDTH}px`,
                          minWidth: `${CHECKBOX_COLUMN_WIDTH}px`,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssetIds.includes(asset.id)}
                          onChange={() => toggleSelectedAsset(asset.id)}
                          className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/40"
                        />
                      </td>

                      {selectedColumns.includes("code") ? (
                        <td
                          className={cn(
                            "align-middle font-mono tracking-[0.04em] text-foreground",
                            densityConfig.cellPadding,
                            activePinnedColumns.includes("code") &&
                              "sticky z-20 border-r border-border bg-card group-hover:bg-accent/70"
                          )}
                          style={{
                            width: `${COLUMN_WIDTHS.code}px`,
                            minWidth: `${COLUMN_WIDTHS.code}px`,
                            left: activePinnedColumns.includes("code")
                              ? `${getPinnedOffset("code")}px`
                              : undefined,
                          }}
                        >
                          {asset.qrCode || asset.id.slice(0, 8)}
                        </td>
                      ) : null}

                      {selectedColumns.includes("name") ? (
                        <td
                          className={cn(
                            "align-middle",
                            densityConfig.cellPadding,
                            activePinnedColumns.includes("name") &&
                              "sticky z-20 border-r border-border bg-card group-hover:bg-accent/70"
                          )}
                          style={{
                            width: `${COLUMN_WIDTHS.name}px`,
                            minWidth: `${COLUMN_WIDTHS.name}px`,
                            left: activePinnedColumns.includes("name")
                              ? `${getPinnedOffset("name")}px`
                              : undefined,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {primaryPhoto ? (
                              <a
                                href={primaryPhoto.url}
                                target="_blank"
                                rel="noreferrer"
                                className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
                              >
                                <Image
                                  src={primaryPhoto.url}
                                  alt={`Foto de ${asset.name}`}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </a>
                            ) : (
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary">
                                <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              </span>
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {asset.brand || "Sin marca"} {asset.model ? `• ${asset.model}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                      ) : null}

                      {selectedColumns.includes("category") ? (
                        <td
                          className={cn(
                            "align-middle text-sm",
                            densityConfig.cellPadding,
                            activePinnedColumns.includes("category") &&
                              "sticky z-20 border-r border-border bg-card group-hover:bg-accent/70"
                          )}
                          style={{
                            width: `${COLUMN_WIDTHS.category}px`,
                            minWidth: `${COLUMN_WIDTHS.category}px`,
                            left: activePinnedColumns.includes("category")
                              ? `${getPinnedOffset("category")}px`
                              : undefined,
                          }}
                        >
                          <span className="inline-flex items-center gap-2.5">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <span className="text-foreground">{asset.category.name}</span>
                          </span>
                        </td>
                      ) : null}

                      {selectedColumns.includes("status") ? (
                        <td
                          className={cn(
                            "align-middle",
                            densityConfig.cellPadding,
                            activePinnedColumns.includes("status") &&
                              "sticky z-20 border-r border-border bg-card group-hover:bg-accent/70"
                          )}
                          style={{
                            width: `${COLUMN_WIDTHS.status}px`,
                            minWidth: `${COLUMN_WIDTHS.status}px`,
                            left: activePinnedColumns.includes("status")
                              ? `${getPinnedOffset("status")}px`
                              : undefined,
                          }}
                        >
                          <Badge variant={statusConfig[asset.status]?.variant ?? "secondary"}>
                            {statusConfig[asset.status]?.label ?? asset.status}
                          </Badge>
                        </td>
                      ) : null}

                      {selectedColumns.includes("value") ? (
                        <td
                          className={cn(
                            "font-medium text-foreground",
                            densityConfig.cellPadding,
                            activePinnedColumns.includes("value") &&
                              "sticky z-20 border-r border-border bg-card group-hover:bg-accent/70"
                          )}
                          style={{
                            width: `${COLUMN_WIDTHS.value}px`,
                            minWidth: `${COLUMN_WIDTHS.value}px`,
                            left: activePinnedColumns.includes("value")
                              ? `${getPinnedOffset("value")}px`
                              : undefined,
                          }}
                        >
                          {formatCurrency(asset.currentValue)}
                        </td>
                      ) : null}

                      {selectedColumns.includes("owner") ? (
                        <td
                          className={cn(
                            "text-foreground",
                            densityConfig.cellPadding,
                            activePinnedColumns.includes("owner") &&
                              "sticky z-20 border-r border-border bg-card group-hover:bg-accent/70"
                          )}
                          style={{
                            width: `${COLUMN_WIDTHS.owner}px`,
                            minWidth: `${COLUMN_WIDTHS.owner}px`,
                            left: activePinnedColumns.includes("owner")
                              ? `${getPinnedOffset("owner")}px`
                              : undefined,
                          }}
                        >
                          {asset.securityUser.name} {asset.securityUser.lastName}
                        </td>
                      ) : null}

                      <td className={densityConfig.cellPadding}>
                        <div className="flex items-center justify-end gap-1.5 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={densityConfig.actionSize}
                            onClick={() => openDetailDialog(asset)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={densityConfig.actionSize}
                            onClick={() => openEditDialog(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {sortedAssets.length > ITEMS_PER_PAGE ? (
        <div className="ml-auto flex w-fit items-center gap-1.5 rounded-lg border border-border bg-card p-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Pagina anterior</span>
          </Button>

          <span className="min-w-[132px] text-center text-sm tracking-[0.01em] text-muted-foreground">
            Pagina {currentPage} de {totalPages}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Pagina siguiente</span>
          </Button>
        </div>
      ) : null}

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

      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);

          if (!open) {
            setImportFile(null);
            setImportCsvContent("");
            setImportPreview(null);
            setPreviewingImport(false);
            setImportingFromCsv(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importacion masiva de activos (CSV)</DialogTitle>
            <DialogDescription>
              Valida el archivo antes de confirmar. Solo se importan filas sin errores.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Plantilla recomendada</p>
                <p className="text-xs text-muted-foreground">
                  Columnas base: nombre, categoria, responsable_email, estado, nivel_ens.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadImportTemplate}>
                <FileDown className="mr-2 h-4 w-4" />
                Descargar plantilla
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="file"
                accept=".csv"
                className="max-w-[360px]"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  setImportFile(nextFile);
                  setImportCsvContent("");
                  setImportPreview(null);
                }}
              />
              <Button
                variant="outline"
                onClick={handleGenerateImportPreview}
                disabled={!importFile || previewingImport}
              >
                {previewingImport ? "Validando..." : "Validar archivo"}
              </Button>
            </div>

            {importPreview ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      Filas totales
                    </p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                      {importPreview.summary.totalRows}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      Filas validas
                    </p>
                    <p className="mt-1 text-xl font-semibold text-emerald-400">
                      {importPreview.summary.validRows}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      Filas con error
                    </p>
                    <p className="mt-1 text-xl font-semibold text-rose-400">
                      {importPreview.summary.invalidRows}
                    </p>
                  </div>
                </div>

                <div className="max-h-72 overflow-auto rounded-lg border border-border scrollbar-thin">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card/95 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                        <th className="px-3 py-2 text-left">Fila</th>
                        <th className="px-3 py-2 text-left">Activo</th>
                        <th className="px-3 py-2 text-left">Categoria</th>
                        <th className="px-3 py-2 text-left">Responsable</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.rows.map((row) => (
                        <tr key={row.rowNumber} className="border-b border-border/70 align-top">
                          <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-foreground">{row.fields.name || "-"}</p>
                            {row.errors.length > 0 ? (
                              <p className="mt-1 text-xs text-rose-400">{row.errors.join(" • ")}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-foreground">{row.fields.category || "-"}</td>
                          <td className="px-3 py-2 text-foreground">{row.fields.securityEmail || "-"}</td>
                          <td className="px-3 py-2">
                            <Badge variant={row.valid ? "success" : "destructive"}>
                              {row.valid ? "Valida" : "Con errores"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Carga un archivo y pulsa &quot;Validar archivo&quot; para ver la vista previa.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleImportAssetsFromCsv}
              disabled={!importPreview?.summary.canImport || importingFromCsv}
            >
              {importingFromCsv ? "Importando..." : "Confirmar importacion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setDetailAsset(null);
            setAssetPhotoFile(null);
            setAssetInvoiceFile(null);
            setDeletingAttachmentId(null);
            setSettingPrimaryAttachmentId(null);
          }
        }}
      >
        <DialogContent className="left-auto right-0 top-0 h-screen max-h-screen w-full max-w-[560px] translate-x-0 translate-y-0 gap-0 rounded-none border-l border-border p-0">
          {detailAsset ? (
            <>
              <DialogHeader className="space-y-2 border-b border-border px-6 py-5 text-left">
                <DialogTitle className="text-xl">{detailAsset.name}</DialogTitle>
                <DialogDescription>
                  {detailAsset.brand || "Sin marca"} {detailAsset.model ? `• ${detailAsset.model}` : ""}
                </DialogDescription>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge variant={statusConfig[detailAsset.status]?.variant ?? "secondary"}>
                    {statusConfig[detailAsset.status]?.label ?? detailAsset.status}
                  </Badge>
                  <Badge variant="outline">{detailAsset.qrCode || detailAsset.id.slice(0, 8)}</Badge>
                </div>
              </DialogHeader>

              <div className="scrollbar-thin space-y-5 overflow-y-auto px-6 py-5">
                {detailPrimaryPhoto ? (
                  <a
                    href={detailPrimaryPhoto.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <div className="relative h-56 w-full sm:h-64">
                      <Image
                        src={detailPrimaryPhoto.url}
                        alt={`Foto de ${detailAsset.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 560px"
                        className="object-cover"
                      />
                    </div>
                  </a>
                ) : null}

                <div className="grid gap-3 rounded-xl border border-border bg-card p-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Categoria</p>
                    <p className="mt-1 font-medium text-foreground">{detailAsset.category.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Ubicacion</p>
                    <p className="mt-1 font-medium text-foreground">{detailAsset.location || "Sin ubicacion"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Valor actual</p>
                    <p className="mt-1 font-medium text-foreground">{formatCurrency(detailAsset.currentValue)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Nivel ENS</p>
                    <p className="mt-1 font-medium text-foreground">{detailAsset.ensLevel}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    Responsable de seguridad
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {detailAsset.securityUser.name} {detailAsset.securityUser.lastName}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Asignacion actual</p>
                  <p className="mt-1 font-medium text-foreground">
                    {detailAsset.assignments[0]?.user
                      ? `${detailAsset.assignments[0].user.name} ${detailAsset.assignments[0].user.lastName}`
                      : detailAsset.assignments[0]?.department?.name || "Sin asignacion"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Descripcion</p>
                  <p className="mt-1 text-foreground">
                    {detailAsset.description || "Sin descripcion registrada"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      Fotos del activo
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {detailPhotoAttachments.length} adjuntas
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setAssetPhotoFile(event.target.files?.[0] || null)}
                      className="max-w-[250px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUploadAssetAttachment("PHOTO")}
                      disabled={!assetPhotoFile || uploadingAssetPhoto}
                    >
                      {uploadingAssetPhoto ? "Subiendo..." : "Subir foto"}
                    </Button>
                  </div>

                  {detailPhotoAttachments.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {detailPhotoAttachments.map((attachment) => (
                        <li
                          key={attachment.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/55 px-3 py-2"
                        >
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-w-0 items-center gap-3"
                          >
                            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                              <Image
                                src={attachment.url}
                                alt={getAssetAttachmentLabel(attachment.caption, "Foto del activo")}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground hover:text-primary">
                                {getAssetAttachmentLabel(attachment.caption, "Foto")}
                              </p>
                              {attachment.isPrimary ? (
                                <p className="text-[11px] text-muted-foreground">Foto principal</p>
                              ) : null}
                            </div>
                          </a>
                          <div className="flex items-center gap-1.5">
                            {!attachment.isPrimary ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleSetPrimaryAssetPhoto(attachment.id)}
                                disabled={
                                  settingPrimaryAttachmentId === attachment.id ||
                                  deletingAttachmentId === attachment.id
                                }
                              >
                                {settingPrimaryAttachmentId === attachment.id
                                  ? "Guardando..."
                                  : "Marcar principal"}
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteAssetAttachment(attachment.id)}
                              disabled={
                                deletingAttachmentId === attachment.id ||
                                settingPrimaryAttachmentId === attachment.id
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar foto</span>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">No hay fotos registradas.</p>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      Facturas y comprobantes
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {detailInvoiceAttachments.length} adjuntos
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx,.csv"
                      onChange={(event) => setAssetInvoiceFile(event.target.files?.[0] || null)}
                      className="max-w-[250px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUploadAssetAttachment("INVOICE")}
                      disabled={!assetInvoiceFile || uploadingAssetInvoice}
                    >
                      {uploadingAssetInvoice ? "Subiendo..." : "Subir factura"}
                    </Button>
                  </div>

                  {detailInvoiceAttachments.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {detailInvoiceAttachments.map((attachment) => (
                        <li
                          key={attachment.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/55 px-3 py-2"
                        >
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-sm font-medium text-foreground hover:text-primary"
                          >
                            {getAssetAttachmentLabel(attachment.caption, "Factura")}
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteAssetAttachment(attachment.id)}
                            disabled={deletingAttachmentId === attachment.id}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar factura</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">No hay facturas registradas.</p>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
                <Button variant="outline" onClick={() => handleExportSingleAssetCsv(detailAsset)}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      openEditDialog(detailAsset);
                      setDetailDialogOpen(false);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar activo
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar activo</DialogTitle>
            <DialogDescription>Actualiza toda la informacion del activo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
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
            <div className="grid gap-4 md:grid-cols-2">
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
            <div className="grid gap-4 md:grid-cols-2">
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
            <div className="grid gap-4 md:grid-cols-2">
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
            <div className="grid gap-4 md:grid-cols-2">
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
            <div className="grid gap-4 md:grid-cols-2">
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
