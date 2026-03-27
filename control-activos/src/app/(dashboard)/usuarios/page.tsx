"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  Package,
  FileText,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  photo: string | null;
  employeeNumber: string;
  position: string;
  department: string;
  hireDate: string;
  role: "ADMIN" | "EDITOR" | "USER";
  isActive: boolean;
  assetCount: number;
  documents: { name: string; type: string; size: string }[];
}

const users: User[] = [
  {
    id: "1",
    name: "Juan",
    lastName: "Pérez García",
    email: "juan@empresa.com",
    phone: "+52 55 1234 5678",
    photo: null,
    employeeNumber: "EMP-0042",
    position: "Desarrollador Senior",
    department: "Tecnología",
    hireDate: "2023-03-15",
    role: "USER",
    isActive: true,
    assetCount: 2,
    documents: [
      { name: "INE_frente.pdf", type: "INE", size: "2.1 MB" },
      { name: "Contrato_2023.pdf", type: "Contrato", size: "1.5 MB" },
      { name: "Comprobante.pdf", type: "Domicilio", size: "0.8 MB" },
    ],
  },
  {
    id: "2",
    name: "María",
    lastName: "López García",
    email: "maria@empresa.com",
    phone: "+52 55 2345 6789",
    photo: null,
    employeeNumber: "EMP-0015",
    position: "Líder de Tecnología",
    department: "Tecnología",
    hireDate: "2021-06-01",
    role: "EDITOR",
    isActive: true,
    assetCount: 3,
    documents: [
      { name: "INE_frente.pdf", type: "INE", size: "2.0 MB" },
      { name: "Contrato_2021.pdf", type: "Contrato", size: "1.4 MB" },
    ],
  },
  {
    id: "3",
    name: "Pedro",
    lastName: "Ruiz Martínez",
    email: "pedro@empresa.com",
    phone: "+52 55 3456 7890",
    photo: null,
    employeeNumber: "EMP-0089",
    position: "Ejecutivo de Ventas",
    department: "Ventas",
    hireDate: "2022-01-10",
    role: "USER",
    isActive: true,
    assetCount: 4,
    documents: [
      { name: "INE_frente.pdf", type: "INE", size: "1.9 MB" },
      { name: "Licencia_conducir.pdf", type: "Licencia", size: "0.5 MB" },
    ],
  },
  {
    id: "4",
    name: "Ana",
    lastName: "Torres Sánchez",
    email: "ana@empresa.com",
    phone: "+52 55 4567 8901",
    photo: null,
    employeeNumber: "EMP-0023",
    position: "Directora de Administración",
    department: "Administración",
    hireDate: "2020-09-01",
    role: "ADMIN",
    isActive: true,
    assetCount: 1,
    documents: [
      { name: "INE_frente.pdf", type: "INE", size: "2.2 MB" },
      { name: "Contrato_2020.pdf", type: "Contrato", size: "1.6 MB" },
    ],
  },
  {
    id: "5",
    name: "Carlos",
    lastName: "Mendoza Rivera",
    email: "carlos@empresa.com",
    phone: "+52 55 5678 9012",
    photo: null,
    employeeNumber: "EMP-0156",
    position: "Responsable de Seguridad",
    department: "Tecnología",
    hireDate: "2019-04-15",
    role: "EDITOR",
    isActive: true,
    assetCount: 0,
    documents: [
      { name: "INE_frente.pdf", type: "INE", size: "2.3 MB" },
      { name: "Certificado_seguridad.pdf", type: "Certificado", size: "0.9 MB" },
    ],
  },
];

const roleColors: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ADMIN: { label: "Admin", variant: "default" },
  EDITOR: { label: "Editor", variant: "secondary" },
  USER: { label: "Usuario", variant: "outline" },
};

export default function UsuariosPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios y sus documentos
          </p>
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
              <DialogDescription>
                Ingresa los datos del nuevo usuario
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input id="name" placeholder="Juan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input id="lastName" placeholder="Pérez García" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="juan@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" placeholder="+52 55 1234 5678" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Puesto *</Label>
                  <Input id="position" placeholder="Desarrollador" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tech">Tecnología</SelectItem>
                      <SelectItem value="ops">Operaciones</SelectItem>
                      <SelectItem value="sales">Ventas</SelectItem>
                      <SelectItem value="admin">Administración</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Fecha de ingreso *</Label>
                  <Input id="hireDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select>
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
              </div>
              <div className="space-y-2">
                <Label>Foto de perfil</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir foto
                  </Button>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o número de empleado..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Grid */}
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
                      <p className="text-sm text-muted-foreground">
                        {user.position}
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
                    <Badge variant={roleColors[user.role]?.variant}>
                      {roleColors[user.role]?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{user.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>{user.assetCount} activos asignados</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{user.documents.length} documentos</span>
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

      {/* User Detail Dialog */}
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  <TabsTrigger value="assets">Activos</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Teléfono</Label>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Número de empleado
                      </Label>
                      <p className="font-medium">
                        {selectedUser.employeeNumber}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Departamento
                      </Label>
                      <p className="font-medium">{selectedUser.department}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Fecha de ingreso
                      </Label>
                      <p className="font-medium">{selectedUser.hireDate}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Rol</Label>
                      <Badge variant={roleColors[selectedUser.role]?.variant}>
                        {roleColors[selectedUser.role]?.label}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-muted-foreground mb-2 block">
                      Firma Digital
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                        <span className="text-sm">
                          Sin firma registrada
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        Capturar firma
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.documents.length} documentos
                    </p>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir documento
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {selectedUser.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.type} • {doc.size}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="assets" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.assetCount} activos asignados
                  </p>

                  {selectedUser.assetCount > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              Laptop Dell XPS 15
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ACT-0042 • Asignado: 10/01/2024
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No tiene activos asignados</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button variant="outline" asChild>
                  <a href="#">📄 Exportar PDF</a>
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar usuario
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats */}
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
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.isActive).length}
                </p>
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
                  {users.reduce((acc, u) => acc + u.assetCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Activos asignados
                </p>
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
                  {users.reduce((acc, u) => acc + u.documents.length, 0)}
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
