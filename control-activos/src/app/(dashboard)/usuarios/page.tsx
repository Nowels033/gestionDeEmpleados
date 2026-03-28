"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Mail,
  Building2,
  Package,
  FileText,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/loading";
import { useFetch } from "@/lib/hooks/use-fetch";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string | null;
  photo: string | null;
  employeeNumber: string;
  position: string;
  hireDate: string;
  role: "ADMIN" | "EDITOR" | "USER";
  isActive: boolean;
  department: {
    id: string;
    name: string;
  };
  _count: {
    assignments: number;
    documents: number;
  };
}

interface Department {
  id: string;
  name: string;
}

const roleColors: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ADMIN: { label: "Admin", variant: "default" },
  EDITOR: { label: "Editor", variant: "secondary" },
  USER: { label: "Usuario", variant: "outline" },
};

export default function UsuariosPage() {
  const { data: users, loading, refetch } = useFetch<User[]>("/api/usuarios", []);
  const { data: departments } = useFetch<Department[]>("/api/departamentos", []);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    employeeNumber: "",
    position: "",
    departmentId: "",
    hireDate: "",
    role: "USER" as "ADMIN" | "EDITOR" | "USER",
    password: "",
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      lastName: "",
      email: "",
      phone: "",
      employeeNumber: "",
      position: "",
      departmentId: "",
      hireDate: "",
      role: "USER",
      password: "",
    });
  };

  const handleCreateUser = async () => {
    if (
      !formData.name ||
      !formData.lastName ||
      !formData.email ||
      !formData.employeeNumber ||
      !formData.position ||
      !formData.departmentId ||
      !formData.hireDate ||
      !formData.password
    ) {
      toast.error("Completa los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible crear el usuario");
        return;
      }

      toast.success("Usuario creado correctamente");
      setDialogOpen(false);
      resetForm();
      refetch();
    } catch {
      toast.error("No fue posible crear el usuario");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading text="Cargando usuarios..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios y sus documentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Usuario</DialogTitle>
              <DialogDescription>Ingresa los datos del nuevo usuario</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    placeholder="Juan"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    placeholder="Perez Garcia"
                    value={formData.lastName}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, lastName: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@empresa.com"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    placeholder="+52 55 1234 5678"
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeNumber">Numero de empleado *</Label>
                  <Input
                    id="employeeNumber"
                    placeholder="EMP-0042"
                    value={formData.employeeNumber}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        employeeNumber: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Puesto *</Label>
                  <Input
                    id="position"
                    placeholder="Desarrollador"
                    value={formData.position}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, position: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departamento *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, departmentId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Fecha de ingreso *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, hireDate: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "ADMIN" | "EDITOR" | "USER") =>
                      setFormData((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Usuario</SelectItem>
                      <SelectItem value="EDITOR">Editor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contrasena *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimo 8 caracteres"
                    value={formData.password}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser} disabled={submitting}>
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o numero de empleado..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.photo || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(user.name, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {user.name} {user.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.position}</p>
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
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver perfil
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

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{user.employeeNumber}</Badge>
                    <Badge variant={roleColors[user.role].variant}>
                      {roleColors[user.role].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{user.department.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{user._count.assignments} activos asignados</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{user._count.documents} documentos</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedUser(user);
                    setDetailDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver perfil completo
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUser.photo || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(selectedUser.name, selectedUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span>
                      {selectedUser.name} {selectedUser.lastName}
                    </span>
                    <p className="text-sm font-normal text-muted-foreground">
                      {selectedUser.position}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informacion</TabsTrigger>
                  <TabsTrigger value="assets">Activos</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Telefono</Label>
                      <p className="font-medium">{selectedUser.phone || "No registrado"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Numero de empleado</Label>
                      <p className="font-medium">{selectedUser.employeeNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Departamento</Label>
                      <p className="font-medium">{selectedUser.department.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fecha de ingreso</Label>
                      <p className="font-medium">
                        {new Date(selectedUser.hireDate).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Rol</Label>
                      <Badge variant={roleColors[selectedUser.role].variant}>
                        {roleColors[selectedUser.role].label}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-muted-foreground mb-2 block">Estado</Label>
                    <Badge variant={selectedUser.isActive ? "success" : "secondary"}>
                      {selectedUser.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </TabsContent>

                <TabsContent value="assets" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedUser._count.assignments} activos asignados actualmente
                  </p>
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>El detalle de activos se mostrara en una siguiente iteracion</p>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar usuario
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total usuarios</p>
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
                <p className="text-2xl font-bold">{users.filter((user) => user.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Activos</p>
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
                  {users.reduce((acc, user) => acc + user._count.assignments, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Activos asignados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users.reduce((acc, user) => acc + user._count.documents, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
