"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Users,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/loading";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalAssets: number;
  assignedAssets: number;
  availableAssets: number;
  maintenanceAssets: number;
  totalValue: number;
  totalUsers: number;
}

interface CategoryStat {
  name: string;
  value: number;
  icon: string | null;
}

interface RecentAsset {
  id: string;
  name: string;
  category: { name: string };
  status: string;
  assignments: { user: { name: string; lastName: string } }[];
}

interface DepartmentStat {
  name: string;
  employeeCount: number;
  assetCount: number;
  assetValue: number;
}

interface DashboardData {
  stats: DashboardStats;
  categoryStats: CategoryStat[];
  recentAssets: RecentAsset[];
  departmentStats: DepartmentStat[];
}

const defaultData: DashboardData = {
  stats: {
    totalAssets: 0,
    assignedAssets: 0,
    availableAssets: 0,
    maintenanceAssets: 0,
    totalValue: 0,
    totalUsers: 0,
  },
  categoryStats: [],
  recentAssets: [],
  departmentStats: [],
};

const statusLabels: Record<string, string> = {
  AVAILABLE: "Disponible",
  ASSIGNED: "Asignado",
  MAINTENANCE: "Mantenimiento",
  RETIRED: "Dado de baja",
};

const COLORS = ["#00F2FE", "#25D4EE", "#31B5DA", "#4A7D9A", "#5A6678", "#7A8190"];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { data, loading, error, refetch } = useFetch<DashboardData>(
    "/api/dashboard",
    defaultData
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={refetch}>Reintentar</Button>
      </div>
    );
  }

  const { stats, categoryStats, recentAssets, departmentStats } = data;

  const statsCards = [
    {
      title: "Total Activos",
      value: stats.totalAssets.toString(),
      icon: Package,
      color: "text-primary",
      bgColor: "bg-[linear-gradient(135deg,rgba(0,242,254,0.2)_0%,rgba(0,242,254,0.06)_100%)]",
    },
    {
      title: "Asignados",
      value: stats.assignedAssets.toString(),
      change: stats.totalAssets
        ? `${Math.round((stats.assignedAssets / stats.totalAssets) * 100)}%`
        : "0%",
      icon: CheckCircle,
      color: "text-foreground",
      bgColor: "bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)]",
    },
    {
      title: "En Mantenimiento",
      value: stats.maintenanceAssets.toString(),
      icon: AlertTriangle,
      color: "text-foreground",
      bgColor: "bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)]",
    },
    {
      title: "Valor Total",
      value: formatCurrency(stats.totalValue),
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-[linear-gradient(135deg,rgba(0,242,254,0.2)_0%,rgba(0,242,254,0.06)_100%)]",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item}>
        <DashboardPageHeader
          eyebrow="Panel"
          title="Bienvenido"
          description="Resumen del estado de tus activos empresariales"
        />
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="group overflow-hidden border-border/90">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-semibold tracking-[-0.02em]">{stat.value}</p>
                  {stat.change && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3" />
                      {stat.change}
                    </div>
                  )}
                </div>
                <div className={`rounded-xl border border-border/80 p-3 shadow-[0_12px_24px_-20px_rgba(0,0,0,0.8)] ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts */}
      {categoryStats.length > 0 && (
        <motion.div variants={item} className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#a5a5a5" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#a5a5a5" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribución</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={104}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {categoryStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0d0d0d" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {categoryStats.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-medium">{entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent & Departments */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay activos registrados
              </p>
            ) : (
              <div className="space-y-4">
                {recentAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/55 p-3 transition-colors hover:bg-secondary/75"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-[linear-gradient(135deg,rgba(0,242,254,0.16)_0%,rgba(0,242,254,0.03)_100%)]">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.category.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {statusLabels[asset.status] || asset.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Departamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {departmentStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay departamentos registrados
              </p>
            ) : (
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/55 p-3 transition-colors hover:bg-secondary/75"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-[linear-gradient(135deg,rgba(0,242,254,0.16)_0%,rgba(0,242,254,0.03)_100%)]">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dept.employeeCount} empleados • {dept.assetCount} activos
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-sm">
                      {formatCurrency(dept.assetValue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-border bg-[linear-gradient(135deg,rgba(0,242,254,0.16)_0%,rgba(0,242,254,0.03)_100%)] p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-border bg-[linear-gradient(135deg,rgba(0,242,254,0.16)_0%,rgba(0,242,254,0.03)_100%)] p-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.availableAssets}</p>
                <p className="text-sm text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-border bg-[linear-gradient(135deg,rgba(0,242,254,0.16)_0%,rgba(0,242,254,0.03)_100%)] p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{departmentStats.length}</p>
                <p className="text-sm text-muted-foreground">Departamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
