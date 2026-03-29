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
  FileDown,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  Upload,
  Image as ImageIcon,
  Download,
  ChevronLeft,
  ChevronRight,
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
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Switch } from "@/components/ui/switch";
import { DashboardPageHeader } from "@/components/layout/dashboard-page-header";
import { useFetch } from "@/lib/hooks/use-fetch";
import { downloadCsv } from "@/lib/csv";
import { APP_COMMAND_EVENT, consumePendingAppCommand } from "@/lib/command-bus";
import { uploadFileToServer } from "@/lib/upload-client";
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
  documents: UserDocument[];
}

interface UserDocument {
  id: string;
  name: string;
  type: "INE" | "CONTRATO" | "DOMICILIO" | "LICENCIA" | "CV" | "CERTIFICADO" | "OTRO";
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
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
  const FILTERS_STORAGE_KEY = "usuarios.filters.v1";

  const { data: users, loading, refetch } = useFetch<User[]>("/api/usuarios", []);
  const { data: departments } = useFetch<Department[]>("/api/departamentos?view=options", []);

  const [searchQuery, setSearchQuery] = React.useState("");
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [filtersHydrated, setFiltersHydrated] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 18;
  const [editFormData, setEditFormData] = React.useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    employeeNumber: "",
    position: "",
    departmentId: "",
    hireDate: "",
    role: "USER" as "ADMIN" | "EDITOR" | "USER",
    isActive: true,
    photo: "",
    password: "",
  });
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
  const [userPhotoFile, setUserPhotoFile] = React.useState<File | null>(null);
  const [userDocumentFile, setUserDocumentFile] = React.useState<File | null>(null);
  const [userDocumentType, setUserDocumentType] = React.useState<
    "INE" | "CONTRATO" | "DOMICILIO" | "LICENCIA" | "CV" | "CERTIFICADO" | "OTRO"
  >("OTRO");
  const [userDocumentName, setUserDocumentName] = React.useState("");
  const [uploadingUserPhoto, setUploadingUserPhoto] = React.useState(false);
  const [uploadingUserDocument, setUploadingUserDocument] = React.useState(false);
  const [deletingUserDocumentId, setDeletingUserDocumentId] = React.useState<string | null>(null);

  const filteredUsers = React.useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.lastName.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.employeeNumber.toLowerCase().includes(normalizedQuery)
    );
  }, [users, deferredSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  const paginatedUsers = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const shouldStaggerUserCards = paginatedUsers.length <= 12;

  const allFilteredSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((user) => selectedUserIds.includes(user.id));

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const resetForm = React.useCallback(() => {
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
  }, []);

  React.useEffect(() => {
    if (filtersHydrated) {
      return;
    }

    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { searchQuery?: string };
        if (typeof parsed.searchQuery === "string") {
          setSearchQuery(parsed.searchQuery);
        }
      }
    } catch {
      // noop
    } finally {
      setFiltersHydrated(true);
    }
  }, [filtersHydrated]);

  React.useEffect(() => {
    if (!filtersHydrated) {
      return;
    }

    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({ searchQuery })
    );
  }, [filtersHydrated, searchQuery]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      employeeNumber: user.employeeNumber,
      position: user.position,
      departmentId: user.department.id,
      hireDate: new Date(user.hireDate).toISOString().slice(0, 10),
      role: user.role,
      isActive: user.isActive,
      photo: user.photo || "",
      password: "",
    });
    setEditDialogOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) {
      return;
    }

    if (
      !editFormData.name.trim() ||
      !editFormData.lastName.trim() ||
      !editFormData.email.trim() ||
      !editFormData.employeeNumber.trim() ||
      !editFormData.position.trim() ||
      !editFormData.departmentId ||
      !editFormData.hireDate
    ) {
      toast.error("Completa los campos requeridos");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/usuarios/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          lastName: editFormData.lastName.trim(),
          email: editFormData.email.trim().toLowerCase(),
          phone: editFormData.phone.trim() || null,
          employeeNumber: editFormData.employeeNumber.trim(),
          position: editFormData.position.trim(),
          departmentId: editFormData.departmentId,
          hireDate: editFormData.hireDate,
          role: editFormData.role,
          isActive: editFormData.isActive,
          photo: editFormData.photo.trim() || null,
          password: editFormData.password.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible actualizar");
        return;
      }

      toast.success("Usuario actualizado");
      setEditDialogOpen(false);
      refetch();
    } catch {
      toast.error("No fue posible actualizar");
    } finally {
      setActionLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadUserPhoto = async () => {
    if (!selectedUser || !userPhotoFile) {
      toast.error("Selecciona una foto para subir");
      return;
    }

    try {
      setUploadingUserPhoto(true);
      const upload = await uploadFileToServer(userPhotoFile, "user-photos");

      const response = await fetch(`/api/usuarios/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: upload.fileUrl }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "No fue posible actualizar la foto");
        return;
      }

      setSelectedUser((prev) => (prev ? { ...prev, photo: upload.fileUrl } : prev));
      setEditFormData((prev) => ({ ...prev, photo: upload.fileUrl }));
      setUserPhotoFile(null);
      refetch();
      toast.success("Foto de usuario actualizada");
    } catch {
      toast.error("No fue posible subir la foto");
    } finally {
      setUploadingUserPhoto(false);
    }
  };

  const handleUploadUserDocument = async () => {
    if (!selectedUser || !userDocumentFile) {
      toast.error("Selecciona un documento para subir");
      return;
    }

    try {
      setUploadingUserDocument(true);
      const upload = await uploadFileToServer(userDocumentFile, "user-documents");

      const response = await fetch(`/api/usuarios/${selectedUser.id}/documentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userDocumentName.trim() || upload.fileName,
          type: userDocumentType,
          fileUrl: upload.fileUrl,
          fileSize: upload.fileSize,
          mimeType: upload.mimeType,
        }),
      });

      const body = await response.json().catch(() => null);
      if (!response.ok || !body) {
        toast.error(body?.error ?? "No fue posible guardar el documento");
        return;
      }

      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              documents: [body, ...prev.documents],
              _count: {
                ...prev._count,
                documents: prev._count.documents + 1,
              },
            }
          : prev
      );
      setUserDocumentFile(null);
      setUserDocumentName("");
      refetch();
      toast.success("Documento cargado");
    } catch {
      toast.error("No fue posible subir el documento");
    } finally {
      setUploadingUserDocument(false);
    }
  };

  const handleDeleteUserDocument = async (documentId: string) => {
    if (!selectedUser) {
      return;
    }

    try {
      setDeletingUserDocumentId(documentId);
      const response = await fetch(
        `/api/usuarios/${selectedUser.id}/documentos/${documentId}`,
        { method: "DELETE" }
      );

      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "No fue posible eliminar el documento");
        return;
      }

      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              documents: prev.documents.filter((document) => document.id !== documentId),
              _count: {
                ...prev._count,
                documents: Math.max(prev._count.documents - 1, 0),
              },
            }
          : prev
      );
      refetch();
      toast.success("Documento eliminado");
    } catch {
      toast.error("No fue posible eliminar el documento");
    } finally {
      setDeletingUserDocumentId(null);
    }
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/usuarios/${selectedUser.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast.error(body?.error ?? "No fue posible eliminar");
        return;
      }

      toast.success("Usuario eliminado");
      setDeleteDialogOpen(false);
      setDetailDialogOpen(false);
      setSelectedUser(null);
      setSelectedUserIds((prev) => prev.filter((id) => id !== selectedUser.id));
      refetch();
    } catch {
      toast.error("No fue posible eliminar");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectedUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAllFilteredUsers = () => {
    const visibleIds = paginatedUsers.map((user) => user.id);
    if (allFilteredSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }

    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedUserIds.length === 0) {
      return;
    }

    try {
      setBulkLoading(true);
      const results = await Promise.all(
        selectedUserIds.map(async (userId) => {
          const response = await fetch(`/api/usuarios/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive }),
          });
          return response.ok;
        })
      );

      const successCount = results.filter(Boolean).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(
          `${successCount} usuarios ${isActive ? "activados" : "desactivados"}`
        );
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} usuarios no pudieron actualizarse`);
      }

      setSelectedUserIds([]);
      refetch();
    } catch {
      toast.error("No fue posible actualizar usuarios seleccionados");
    } finally {
      setBulkLoading(false);
    }
  };

  const openBulkDeleteDialog = () => {
    if (selectedUserIds.length === 0) {
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) {
      return;
    }

    try {
      setBulkLoading(true);
      const results = await Promise.all(
        selectedUserIds.map(async (userId) => {
          const response = await fetch(`/api/usuarios/${userId}`, {
            method: "DELETE",
          });
          return response.ok;
        })
      );

      const successCount = results.filter(Boolean).length;
      const failedCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} usuarios eliminados`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} usuarios no pudieron eliminarse`);
      }

      setSelectedUserIds([]);
      setSelectedUser(null);
      setDetailDialogOpen(false);
      setBulkDeleteDialogOpen(false);
      refetch();
    } catch {
      toast.error("No fue posible eliminar usuarios seleccionados");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      filteredUsers,
      [
        { key: "employeeNumber", header: "Numero Empleado" },
        { key: "name", header: "Nombre", map: (user) => `${user.name} ${user.lastName}` },
        { key: "email", header: "Email" },
        { key: "position", header: "Puesto" },
        { key: "role", header: "Rol" },
        { key: "isActive", header: "Activo", map: (user) => (user.isActive ? "Si" : "No") },
        { key: "department", header: "Departamento", map: (user) => user.department.name },
        {
          key: "assignments",
          header: "Activos Asignados",
          map: (user) => user._count.assignments,
        },
      ],
      `usuarios-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success("CSV exportado correctamente");
  };

  const executeQuickCommand = React.useCallback(
    (command: string) => {
      if (command === "new-user") {
        resetForm();
        setDialogOpen(true);
      }
    },
    [resetForm]
  );

  React.useEffect(() => {
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
  }, [executeQuickCommand]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        toggleAllFilteredUsers();
      }

      if (key === "e") {
        event.preventDefault();
        handleExportCsv();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUsers, selectedUserIds]);

  if (loading) {
    return <Loading text="Cargando usuarios..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <DashboardPageHeader
        eyebrow="Talento"
        title="Usuarios"
        description="Gestiona los usuarios y sus documentos"
        actions={
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
              <div className="grid gap-4 md:grid-cols-2">
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
              <div className="grid gap-4 md:grid-cols-2">
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
              <div className="grid gap-4 md:grid-cols-2">
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
              <div className="grid gap-4 md:grid-cols-2">
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
              <div className="grid gap-4 md:grid-cols-2">
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
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o numero de empleado..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={toggleAllFilteredUsers}>
            {allFilteredSelected ? "Quitar visibles" : "Seleccionar visibles"}
          </Button>
          {selectedUserIds.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 px-3.5 py-2.5 text-sm shadow-[0_24px_40px_-30px_rgba(0,0,0,0.9)] backdrop-blur md:left-auto md:right-6 md:max-w-fit">
              <Badge variant="secondary">{selectedUserIds.length} seleccionados</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus(true)}
                disabled={bulkLoading}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatus(false)}
                disabled={bulkLoading}
              >
                <UserX className="h-4 w-4 mr-2" />
                Desactivar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={openBulkDeleteDialog}
                disabled={bulkLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron usuarios"
          description="Ajusta la busqueda o registra un nuevo usuario para continuar."
          actionLabel="Nuevo usuario"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldStaggerUserCards ? Math.min(index, 8) * 0.03 : 0 }}
            >
              <Card className="group cursor-pointer overflow-hidden border-border transition-all duration-200 ease-in-out">
                <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleSelectedUser(user.id)}
                      className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/40"
                    />
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.photo || ""} />
                      <AvatarFallback className="bg-secondary text-foreground text-sm">
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
                      <DropdownMenuItem onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => openDeleteDialog(user)}
                      >
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
      )}

      {filteredUsers.length > ITEMS_PER_PAGE ? (
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

      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setUserPhotoFile(null);
            setUserDocumentFile(null);
            setUserDocumentName("");
            setDeletingUserDocumentId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUser.photo || ""} />
                    <AvatarFallback className="bg-secondary text-foreground">
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
                  <TabsTrigger value="info">Informacion</TabsTrigger>
                  <TabsTrigger value="assets">Activos</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid gap-4 text-sm md:grid-cols-2">
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

                  <Separator />

                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      Foto de perfil
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Avatar className="h-14 w-14 border border-border">
                        <AvatarImage src={selectedUser.photo || ""} />
                        <AvatarFallback className="bg-secondary text-foreground">
                          {getInitials(selectedUser.name, selectedUser.lastName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          className="max-w-[240px]"
                          onChange={(event) => setUserPhotoFile(event.target.files?.[0] || null)}
                        />
                        <Button
                          size="sm"
                          onClick={handleUploadUserPhoto}
                          disabled={!userPhotoFile || uploadingUserPhoto}
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          {uploadingUserPhoto ? "Subiendo..." : "Actualizar foto"}
                        </Button>
                      </div>
                    </div>
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

                <TabsContent value="documents" className="space-y-4 mt-4">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      Cargar documento
                    </p>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <Input
                        placeholder="Nombre del documento"
                        value={userDocumentName}
                        onChange={(event) => setUserDocumentName(event.target.value)}
                      />

                      <Select
                        value={userDocumentType}
                        onValueChange={(value: typeof userDocumentType) =>
                          setUserDocumentType(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INE">INE</SelectItem>
                          <SelectItem value="CONTRATO">Contrato</SelectItem>
                          <SelectItem value="DOMICILIO">Comprobante domicilio</SelectItem>
                          <SelectItem value="LICENCIA">Licencia</SelectItem>
                          <SelectItem value="CV">CV</SelectItem>
                          <SelectItem value="CERTIFICADO">Certificado</SelectItem>
                          <SelectItem value="OTRO">Otro</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        onChange={(event) =>
                          setUserDocumentFile(event.target.files?.[0] || null)
                        }
                      />
                    </div>

                    <Button
                      className="mt-3"
                      size="sm"
                      onClick={handleUploadUserDocument}
                      disabled={!userDocumentFile || uploadingUserDocument}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadingUserDocument ? "Subiendo..." : "Subir documento"}
                    </Button>
                  </div>

                  {selectedUser.documents.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedUser.documents.map((document) => (
                        <li
                          key={document.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {document.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {document.type} • {formatFileSize(document.fileSize)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={document.fileUrl} target="_blank" rel="noreferrer">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Descargar documento</span>
                              </a>
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteUserDocument(document.id)}
                              disabled={deletingUserDocumentId === document.id}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar documento</span>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay documentos cargados.</p>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button onClick={() => selectedUser && openEditDialog(selectedUser)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar usuario
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>Actualiza toda la informacion del usuario.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={editFormData.name}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Apellidos *</Label>
                <Input
                  value={editFormData.lastName}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, lastName: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input
                  value={editFormData.phone}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Numero de empleado *</Label>
                <Input
                  value={editFormData.employeeNumber}
                  onChange={(event) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      employeeNumber: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Puesto *</Label>
                <Input
                  value={editFormData.position}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, position: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Departamento *</Label>
                <Select
                  value={editFormData.departmentId}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({ ...prev, departmentId: value }))
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
                <Label>Fecha de ingreso *</Label>
                <Input
                  type="date"
                  value={editFormData.hireDate}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, hireDate: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value: "ADMIN" | "EDITOR" | "USER") =>
                    setEditFormData((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Usuario</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nueva contrasena (opcional)</Label>
                <Input
                  type="password"
                  value={editFormData.password}
                  onChange={(event) =>
                    setEditFormData((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between border rounded-md p-3">
              <div>
                <p className="font-medium">Usuario activo</p>
                <p className="text-sm text-muted-foreground">Permite iniciar sesion en la plataforma</p>
              </div>
              <Switch
                checked={editFormData.isActive}
                onCheckedChange={(checked) =>
                  setEditFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} disabled={actionLoading}>
              {actionLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar usuario"
        description={`Se eliminara ${selectedUser?.name || "este usuario"} ${selectedUser?.lastName || ""}. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteUser}
        loading={actionLoading}
      />

      <ConfirmActionDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Eliminar usuarios seleccionados"
        description={`Se eliminaran ${selectedUserIds.length} usuarios seleccionados. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar seleccionados"
        onConfirm={handleBulkDelete}
        loading={bulkLoading}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-secondary p-3">
                <Users className="h-6 w-6 text-muted-foreground" />
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
              <div className="rounded-xl bg-secondary p-3">
                <Users className="h-6 w-6 text-muted-foreground" />
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
              <div className="rounded-xl bg-secondary p-3">
                <Package className="h-6 w-6 text-muted-foreground" />
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
              <div className="rounded-xl bg-secondary p-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
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
