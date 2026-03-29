"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { signOut } from "next-auth/react";
import {
  ArrowLeftRight,
  Bot,
  Building2,
  Command,
  ChevronRight,
  Download,
  FileDown,
  FileText,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { BRAND_NAME } from "@/lib/brand";
import {
  dispatchAppCommand,
  setPendingAppCommand,
  type AppCommand,
} from "@/lib/command-bus";
import { cn } from "@/lib/utils";
import { AssetOneLogo } from "@/components/layout/assetone-logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activos", label: "Activos", icon: Package },
  { href: "/categorias", label: "Categorias", icon: FolderTree },
  { href: "/departamentos", label: "Departamentos", icon: Building2 },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/asignaciones", label: "Asignaciones", icon: ArrowLeftRight },
  { href: "/mantenimiento", label: "Mantenimiento", icon: Wrench },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/auditoria", label: "Bitacora", icon: ShieldCheck },
  { href: "/reportes", label: "Reportes PDF", icon: FileDown },
  { href: "/chat", label: "Chat IA", icon: Bot },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: "Modulo" | "Accion";
  href?: string;
  command?: AppCommand;
  action?: "toggle-theme";
  keywords: string;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  const [mounted, setMounted] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeSearchIndex, setActiveSearchIndex] = React.useState(0);

  const currentSection = React.useMemo(() => {
    const activeItem = navItems.find((item) => item.href === pathname);
    if (activeItem) {
      return activeItem.label;
    }

    if (pathname === "/") {
      return "Dashboard";
    }

    return pathname
      .replace(/^\//, "")
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" / ");
  }, [pathname]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("");
      setActiveSearchIndex(0);
    }
  }, [searchOpen]);

  const handleNavigate = (href: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    setActiveSearchIndex(0);
    router.push(href);
  };

  const commandItems = React.useMemo<CommandItem[]>(
    () => [
      ...navItems.map((item) => ({
        id: `module-${item.href}`,
        label: item.label,
        description: `Abrir modulo ${item.label.toLowerCase()}`,
        icon: item.icon,
        group: "Modulo" as const,
        href: item.href,
        keywords: `${item.label} ${item.href} panel seccion modulo`,
      })),
      {
        id: "action-new-asset",
        label: "Nuevo activo",
        description: "Crear un activo desde Command Center",
        icon: Plus,
        group: "Accion",
        href: "/activos",
        command: "new-asset",
        keywords: "crear activo inventario alta",
      },
      {
        id: "action-new-assignment",
        label: "Nueva asignacion",
        description: "Registrar una asignacion rapidamente",
        icon: ArrowLeftRight,
        group: "Accion",
        href: "/asignaciones",
        command: "new-assignment",
        keywords: "asignar activo usuario departamento",
      },
      {
        id: "action-new-user",
        label: "Nuevo usuario",
        description: "Registrar un usuario en segundos",
        icon: UserPlus,
        group: "Accion",
        href: "/usuarios",
        command: "new-user",
        keywords: "crear usuario empleado persona",
      },
      {
        id: "action-new-contract",
        label: "Nuevo contrato",
        description: "Registrar un contrato rapidamente",
        icon: FileText,
        group: "Accion",
        href: "/contratos",
        command: "new-contract",
        keywords: "crear contrato proveedor servicio",
      },
      {
        id: "action-export-assets",
        label: "Exportar activos CSV",
        description: "Generar export de activos actual",
        icon: Download,
        group: "Accion",
        href: "/activos",
        command: "export-assets",
        keywords: "exportar csv activos descargar",
      },
      {
        id: "action-import-assets",
        label: "Importar activos CSV",
        description: "Carga masiva de activos con validacion",
        icon: Upload,
        group: "Accion",
        href: "/activos",
        command: "import-assets",
        keywords: "importar csv activos carga masiva",
      },
      {
        id: "action-toggle-theme",
        label: theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro",
        description: "Alternar apariencia del sistema",
        icon: Command,
        group: "Accion",
        action: "toggle-theme",
        keywords: "tema apariencia claro oscuro",
      },
    ],
    [theme]
  );

  const filteredCommandItems = React.useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return commandItems;
    }

    return commandItems.filter((item) =>
      [item.label, item.description, item.keywords, item.href]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [searchQuery, commandItems]);

  React.useEffect(() => {
    if (filteredCommandItems.length === 0) {
      setActiveSearchIndex(0);
      return;
    }

    setActiveSearchIndex((current) =>
      Math.min(Math.max(current, 0), filteredCommandItems.length - 1)
    );
  }, [filteredCommandItems]);

  const executeCommand = (item: CommandItem) => {
    const closeCommandCenter = () => {
      setSearchOpen(false);
      setSearchQuery("");
      setActiveSearchIndex(0);
    };

    if (item.action === "toggle-theme") {
      closeCommandCenter();
      setTheme(theme === "dark" ? "light" : "dark");
      return;
    }

    if (!item.href) {
      return;
    }

    if (item.command) {
      if (pathname === item.href) {
        closeCommandCenter();
        dispatchAppCommand(item.command);
        return;
      } else {
        setPendingAppCommand(item.command);
      }
    }

    handleNavigate(item.href);
  };

  return (
    <div className="min-h-screen bg-background soft-grid">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[90] rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground focus:not-sr-only"
      >
        Saltar al contenido principal
      </a>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-[linear-gradient(180deg,rgba(16,16,16,0.97)_0%,rgba(10,10,10,0.97)_100%)] backdrop-blur-xl transition-transform duration-300 ease-in-out motion-reduce:transition-none lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[74px] items-center justify-between border-b border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_100%)] px-5">
            <Link
              href="/"
              className="min-w-0"
              onClick={() => setSidebarOpen(false)}
              aria-label={`Ir al inicio de ${BRAND_NAME}`}
            >
              <AssetOneLogo subtitle="Asset Control Suite" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar menu lateral"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 scrollbar-thin">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm font-medium tracking-[0.01em] transition-all duration-200 ease-in-out",
                    isActive
                      ? "border-primary/30 bg-[linear-gradient(135deg,rgba(0,242,254,0.16)_0%,rgba(0,242,254,0.06)_100%)] text-foreground shadow-[inset_2px_0_0_rgba(0,242,254,1)]"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-[linear-gradient(180deg,#141414_0%,#101010_100%)] hover:text-foreground"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                  {isActive ? <ChevronRight className="ml-auto h-4 w-4 text-primary" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border px-3 py-3">
            <Link
              href="/configuracion"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm font-medium tracking-[0.01em] transition-all duration-200 ease-in-out",
                pathname === "/configuracion"
                  ? "border-primary/30 bg-[linear-gradient(135deg,rgba(0,242,254,0.16)_0%,rgba(0,242,254,0.06)_100%)] text-foreground shadow-[inset_2px_0_0_rgba(0,242,254,1)]"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-[linear-gradient(180deg,#141414_0%,#101010_100%)] hover:text-foreground"
              )}
            >
              <Settings className="h-[18px] w-[18px]" />
              <span>Configuracion</span>
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-border bg-background/70 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/62 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu lateral"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <button
              type="button"
              className="hidden w-72 items-center gap-2.5 rounded-lg border border-border bg-[linear-gradient(180deg,#121212_0%,#0f0f0f_100%)] px-4 py-2 text-left text-sm text-muted-foreground shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-all duration-200 ease-in-out hover:border-primary/30 hover:text-foreground sm:flex"
              onClick={() => setSearchOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              aria-controls="global-search-dialog"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1">Buscar modulo o accion...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-secondary px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            <div className="hidden lg:block">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Seccion activa
              </p>
              <p className="text-sm font-semibold tracking-[0.01em] text-foreground">{currentSection}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {mounted ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
              >
                <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Cambiar tema</span>
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Abrir notificaciones"
            >
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-foreground">
                3
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Abrir menu de usuario">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src="" alt="Avatar" />
                    <AvatarFallback className="bg-secondary text-foreground">JP</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-60" align="end" forceMount>
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none text-foreground">Juan Perez</p>
                    <p className="text-xs leading-none text-muted-foreground">juan@empresa.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Mi perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuracion</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main id="main-content" className="p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <div className="app-surface p-5 lg:p-7">{children}</div>
          </div>
        </main>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent id="global-search-dialog" className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Command Center</DialogTitle>
            <DialogDescription>
              Navega modulos y ejecuta acciones globales sin salir del teclado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveSearchIndex((current) =>
                      filteredCommandItems.length === 0
                        ? 0
                        : Math.min(current + 1, filteredCommandItems.length - 1)
                    );
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveSearchIndex((current) => Math.max(current - 1, 0));
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                    const selectedItem = filteredCommandItems[activeSearchIndex];
                    if (selectedItem) {
                      executeCommand(selectedItem);
                    }
                  }
                }}
                placeholder="Escribe: activos, nuevo usuario, exportar..."
                className="flex h-11 w-full rounded-lg border border-input bg-card px-10 py-2 text-sm text-foreground outline-none transition-all duration-200 ease-in-out placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/35"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-border scrollbar-thin">
              {filteredCommandItems.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No se encontraron resultados.</p>
              ) : (
                <ul role="listbox" aria-label="Resultados del Command Center" className="divide-y divide-border">
                  {filteredCommandItems.map((item, index) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => executeCommand(item)}
                        onMouseEnter={() => setActiveSearchIndex(index)}
                        role="option"
                        aria-selected={activeSearchIndex === index}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition-all duration-200 ease-in-out hover:bg-accent",
                          activeSearchIndex === index && "bg-accent"
                        )}
                      >
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium tracking-[0.01em] text-foreground">
                            {item.label}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em]",
                            item.group === "Accion"
                              ? "border-primary/35 bg-primary/10 text-primary"
                              : "border-border bg-secondary text-muted-foreground"
                          )}
                        >
                          {item.group}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/55 px-3 py-2 text-[11px] text-muted-foreground">
              <span>Usa ↑ ↓ para moverte y Enter para ejecutar</span>
              <kbd className="inline-flex h-5 items-center rounded border border-border bg-card px-1.5 font-mono text-[10px]">
                esc
              </kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
