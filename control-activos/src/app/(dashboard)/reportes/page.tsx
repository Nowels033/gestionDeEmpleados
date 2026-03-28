"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Package,
  Users,
  Building2,
  TrendingUp,
  Shield,
  Wrench,
  Download,
  Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { useFetch } from "@/lib/hooks/use-fetch";
import toast from "react-hot-toast";

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon;
  formats: string[];
}

interface DashboardData {
  stats: {
    totalAssets: number;
    assignedAssets: number;
    availableAssets: number;
    maintenanceAssets: number;
    retiredAssets: number;
    totalValue: number;
    totalUsers: number;
  };
}

const reports: Report[] = [
  {
    id: "inventory-full",
    name: "Inventario Completo",
    description: "Listado de todos los activos con detalles",
    category: "Inventario",
    icon: Package,
    formats: ["PDF", "Excel"],
  },
  {
    id: "inventory-category",
    name: "Inventario por Categoría",
    description: "Activos agrupados por tipo",
    category: "Inventario",
    icon: Package,
    formats: ["PDF", "Excel"],
  },
  {
    id: "inventory-department",
    name: "Inventario por Departamento",
    description: "Activos agrupados por área",
    category: "Inventario",
    icon: Building2,
    formats: ["PDF", "Excel"],
  },
  {
    id: "assignments-user",
    name: "Asignaciones por Usuario",
    description: "Qué tiene asignado cada empleado",
    category: "Asignaciones",
    icon: Users,
    formats: ["PDF", "Excel"],
  },
  {
    id: "assignment-certificate",
    name: "Constancia de Asignación",
    description: "Certificado de recepción de activo",
    category: "Asignaciones",
    icon: FileText,
    formats: ["PDF"],
  },
  {
    id: "valuation",
    name: "Valoración de Activos",
    description: "Valor total y por categoría",
    category: "Financiero",
    icon: TrendingUp,
    formats: ["PDF", "Excel"],
  },
  {
    id: "depreciation",
    name: "Depreciación",
    description: "Pérdida de valor por periodo",
    category: "Financiero",
    icon: TrendingUp,
    formats: ["PDF", "Excel"],
  },
  {
    id: "ens-audit",
    name: "Auditoría ENS",
    description: "Cumplimiento del Esquema Nacional de Seguridad",
    category: "Seguridad",
    icon: Shield,
    formats: ["PDF"],
  },
  {
    id: "security-verification",
    name: "Verificaciones de Seguridad",
    description: "Estado de revisiones por responsable",
    category: "Seguridad",
    icon: Shield,
    formats: ["PDF"],
  },
  {
    id: "maintenance-summary",
    name: "Resumen de Mantenimiento",
    description: "Mantenimientos realizados y pendientes",
    category: "Mantenimiento",
    icon: Wrench,
    formats: ["PDF", "Excel"],
  },
  {
    id: "contracts-summary",
    name: "Resumen de Contratos",
    description: "Contratos activos y próximos a vencer",
    category: "Contratos",
    icon: FileText,
    formats: ["PDF", "Excel"],
  },
  {
    id: "executive-dashboard",
    name: "Dashboard Ejecutivo",
    description: "Resumen para directivos",
    category: "Ejecutivo",
    icon: TrendingUp,
    formats: ["PDF"],
  },
];

const categories = [
  "Inventario",
  "Asignaciones",
  "Financiero",
  "Seguridad",
  "Mantenimiento",
  "Contratos",
  "Ejecutivo",
];

export default function ReportesPage() {
  const { data: dashboard, loading } = useFetch<DashboardData>("/api/dashboard", {
    stats: {
      totalAssets: 0,
      assignedAssets: 0,
      availableAssets: 0,
      maintenanceAssets: 0,
      retiredAssets: 0,
      totalValue: 0,
      totalUsers: 0,
    },
  });

  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );

  const filteredReports = selectedCategory
    ? reports.filter((r) => r.category === selectedCategory)
    : reports;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(value);

  if (loading) {
    return <Loading text="Cargando reportes..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <DashboardPageHeader
        eyebrow="Inteligencia"
        title="Reportes"
        description="Genera reportes profesionales en PDF y Excel"
      />

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Activos totales</p>
            <p className="text-2xl font-bold">{dashboard.stats.totalAssets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Activos asignados</p>
            <p className="text-2xl font-bold">{dashboard.stats.assignedAssets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Usuarios</p>
            <p className="text-2xl font-bold">{dashboard.stats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Valor inventario</p>
            <p className="text-xl font-bold">{formatCurrency(dashboard.stats.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{report.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{report.category}</Badge>
                  {report.formats.map((format) => (
                    <Badge
                      key={format}
                      variant={format === "PDF" ? "default" : "secondary"}
                    >
                      {format}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toast("Vista previa disponible en siguiente iteracion")}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Vista previa
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => toast.success(`Reporte ${report.name} en cola de generacion`)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Generar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
