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
  description: string;
  icon: string;
  assetCount: number;
  children?: Category[];
}

const categories: Category[] = [
  {
    id: "1",
    name: "Equipos de Cómputo",
    description: "Laptops, desktops y servidores",
    icon: "💻",
    assetCount: 48,
    children: [
      {
        id: "1-1",
        name: "Laptops",
        description: "Portátiles de trabajo",
        icon: "💻",
        assetCount: 24,
      },
      {
        id: "1-2",
        name: "Desktops",
        description: "Computadoras de escritorio",
        icon: "🖥️",
        assetCount: 12,
      },
      {
        id: "1-3",
        name: "Servidores",
        description: "Servidores de infraestructura",
        icon: "🖧",
        assetCount: 4,
      },
    ],
  },
  {
    id: "2",
    name: "Monitores y Pantallas",
    description: "Monitores, proyectores y pantallas",
    icon: "🖥️",
    assetCount: 32,
    children: [
      {
        id: "2-1",
        name: "Monitores",
        description: "Monitores de escritorio",
        icon: "🖥️",
        assetCount: 24,
      },
      {
        id: "2-2",
        name: "Proyectores",
        description: "Proyectores de presentación",
        icon: "📽️",
        assetCount: 8,
      },
    ],
  },
  {
    id: "3",
    name: "Vehículos",
    description: "Autos, camionetas y motos",
    icon: "🚗",
    assetCount: 16,
  },
  {
    id: "4",
    name: "Mobiliario",
    description: "Escritorios, sillas y archiveros",
    icon: "🪑",
    assetCount: 85,
  },
  {
    id: "5",
    name: "Periféricos",
    description: "Impresoras, scanners y cámaras",
    icon: "🖨️",
    assetCount: 28,
  },
  {
    id: "6",
    name: "Software y Licencias",
    description: "Licencias de software",
    icon: "📀",
    assetCount: 42,
  },
];

export default function CategoriasPage() {
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([
    "1",
    "2",
  ]);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
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
                <Input id="name" placeholder="Ej: Equipos de Cómputo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción de la categoría..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icono (emoji)</Label>
                <Input id="icon" placeholder="Ej: 💻" className="w-20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Categoría padre (opcional)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguna (categoría principal)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Foto predeterminada</Label>
                <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Package className="h-6 w-6" />
                    <span className="text-xs">Subir foto</span>
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
            {categories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    category.children && toggleCategory(category.id)
                  }
                >
                  {category.children && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                      {expandedCategories.includes(category.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {!category.children && <div className="w-6" />}

                  <span className="text-2xl">{category.icon}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.assetCount} activos
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {category.description}
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

                {/* Children */}
                {category.children &&
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
                          <span className="text-xl">{child.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {child.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {child.assetCount}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {child.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
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
                <p className="text-2xl font-bold">{categories.length}</p>
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
                  {categories.reduce((acc, cat) => acc + cat.assetCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total de activos categorizados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
