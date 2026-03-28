"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FolderTree,
  Plus,
  Package,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { useFetch } from "@/lib/hooks/use-fetch";
import toast from "react-hot-toast";
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

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  _count: {
    assets: number;
  };
  children?: Category[];
}

export default function CategoriasPage() {
  const {
    data: categories,
    loading,
    refetch,
  } = useFetch<Category[]>("/api/categorias", []);

  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    description: "",
    icon: "",
    parentId: "none",
  });
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    icon: "",
    parentId: "none",
  });

  const categoryAssetCount = React.useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, category) => {
      acc[category.id] = category._count.assets;
      return acc;
    }, {});
  }, [categories]);

  const rootCategories = React.useMemo(
    () => categories.filter((category) => category.parentId === null),
    [categories]
  );

  React.useEffect(() => {
    if (rootCategories.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories(rootCategories.slice(0, 2).map((category) => category.id));
    }
  }, [rootCategories, expandedCategories.length]);

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error("El nombre de la categoria es requerido");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          icon: formData.icon || undefined,
          parentId: formData.parentId === "none" ? undefined : formData.parentId,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible crear la categoria");
        return;
      }

      toast.success("Categoria creada correctamente");
      setDialogOpen(false);
      setFormData({ name: "", description: "", icon: "", parentId: "none" });
      refetch();
    } catch {
      toast.error("No fue posible crear la categoria");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setEditFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      parentId: category.parentId || "none",
    });
    setEditDialogOpen(true);
  };

  const handleEditCategory = async () => {
    if (!selectedCategory) {
      return;
    }

    if (!editFormData.name.trim()) {
      toast.error("El nombre de la categoria es requerido");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/categorias/${selectedCategory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          description: editFormData.description || null,
          icon: editFormData.icon || null,
          parentId: editFormData.parentId === "none" ? null : editFormData.parentId,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible actualizar");
        return;
      }

      toast.success("Categoria actualizada");
      setEditDialogOpen(false);
      setSelectedCategory(null);
      refetch();
    } catch {
      toast.error("No fue posible actualizar");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/categorias/${selectedCategory.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible eliminar");
        return;
      }

      toast.success("Categoria eliminada");
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
      refetch();
    } catch {
      toast.error("No fue posible eliminar");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <Loading text="Cargando categorias..." />;
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
          <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Organiza tus activos por tipo y subcategorías
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Categoría</DialogTitle>
              <DialogDescription>
                Crea una nueva categoría para organizar activos
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Equipos de Computo"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripcion de la categoria..."
                  rows={2}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icono (emoji)</Label>
                <Input
                  id="icon"
                  placeholder="Ej: 💻"
                  className="w-20"
                  value={formData.icon}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, icon: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Categoría padre (opcional)</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, parentId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguna (categoría principal)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {rootCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon || "📁"} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCategory} disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Árbol de Categorías
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rootCategories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    category.children &&
                    category.children.length > 0 &&
                    toggleCategory(category.id)
                  }
                >
                  {category.children && category.children.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      {expandedCategories.includes(category.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {(!category.children || category.children.length === 0) && (
                    <div className="w-6" />
                  )}

                  <span className="text-2xl">{category.icon || "📁"}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category._count.assets} activos
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {category.description || "Sin descripcion"}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar subcategoría
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(category)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openDeleteDialog(category)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Children */}
                {category.children &&
                  category.children.length > 0 &&
                  expandedCategories.includes(category.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-12 space-y-1 border-l-2 border-muted pl-4"
                    >
                      {category.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <span className="text-xl">{child.icon || "📁"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {child.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {categoryAssetCount[child.id] || 0}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {child.description || "Sin descripcion"}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={() => openEditDialog(child)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </motion.div>
                  )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <FolderTree className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rootCategories.length}</p>
                <p className="text-sm text-muted-foreground">
                  Categorías principales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <FolderTree className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categories.reduce(
                    (acc, cat) => acc + (cat.children?.length || 0),
                    0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Subcategorías</p>
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
                  {rootCategories.reduce((acc, cat) => acc + cat._count.assets, 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total de activos categorizados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoria</DialogTitle>
            <DialogDescription>Actualiza toda la informacion de la categoria.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Nombre *</Label>
              <Input
                id="edit-category-name"
                value={editFormData.name}
                onChange={(event) =>
                  setEditFormData((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Descripcion</Label>
              <Textarea
                id="edit-category-description"
                rows={2}
                value={editFormData.description}
                onChange={(event) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-icon">Icono (emoji)</Label>
              <Input
                id="edit-category-icon"
                className="w-20"
                value={editFormData.icon}
                onChange={(event) =>
                  setEditFormData((prev) => ({ ...prev, icon: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-parent">Categoria padre</Label>
              <Select
                value={editFormData.parentId}
                onValueChange={(value) =>
                  setEditFormData((prev) => ({ ...prev, parentId: value }))
                }
              >
                <SelectTrigger id="edit-category-parent">
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {rootCategories
                    .filter((category) => category.id !== selectedCategory?.id)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon || "📁"} {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCategory} disabled={actionLoading}>
              {actionLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar categoria"
        description={`Se eliminara ${selectedCategory?.name || "esta categoria"}. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteCategory}
        loading={actionLoading}
      />
    </motion.div>
  );
}
