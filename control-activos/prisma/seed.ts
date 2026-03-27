import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creando datos de ejemplo...");

  // Crear departamentos (upsert)
  const tech = await prisma.department.upsert({
    where: { name: "Tecnología" },
    update: {},
    create: {
      name: "Tecnología",
      description: "Desarrollo e infraestructura TI",
      location: "Edificio A, Piso 3",
    },
  });

  const ops = await prisma.department.upsert({
    where: { name: "Operaciones" },
    update: {},
    create: {
      name: "Operaciones",
      description: "Producción y logística",
      location: "Edificio B, Piso 1",
    },
  });

  const sales = await prisma.department.upsert({
    where: { name: "Ventas" },
    update: {},
    create: {
      name: "Ventas",
      description: "Equipo comercial",
      location: "Edificio A, Piso 2",
    },
  });

  // Crear categorías (upsert)
  const laptops = await prisma.category.upsert({
    where: { id: "cat-laptops" },
    update: {},
    create: {
      id: "cat-laptops",
      name: "Laptops",
      description: "Portátiles de trabajo",
      icon: "💻",
    },
  });

  const monitores = await prisma.category.upsert({
    where: { id: "cat-monitores" },
    update: {},
    create: {
      id: "cat-monitores",
      name: "Monitores",
      description: "Monitores de escritorio",
      icon: "🖥️",
    },
  });

  const vehiculos = await prisma.category.upsert({
    where: { id: "cat-vehiculos" },
    update: {},
    create: {
      id: "cat-vehiculos",
      name: "Vehículos",
      description: "Autos, camionetas y motos",
      icon: "🚗",
    },
  });

  // Crear usuario admin (upsert)
  const admin = await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: {
      email: "admin@empresa.com",
      password: "$2a$10$dummy.hash.for.development",
      name: "Admin",
      lastName: "Sistema",
      employeeNumber: "EMP-0001",
      position: "Administrador del Sistema",
      hireDate: new Date("2020-01-01"),
      role: "ADMIN",
      departmentId: tech.id,
    },
  });

  // Crear usuario de ejemplo (upsert)
  const user = await prisma.user.upsert({
    where: { email: "juan@empresa.com" },
    update: {},
    create: {
      email: "juan@empresa.com",
      password: "$2a$10$dummy.hash.for.development",
      name: "Juan",
      lastName: "Pérez García",
      phone: "+52 55 1234 5678",
      employeeNumber: "EMP-0042",
      position: "Desarrollador Senior",
      hireDate: new Date("2023-03-15"),
      role: "USER",
      departmentId: tech.id,
    },
  });

  // Crear activos (upsert)
  const laptop = await prisma.asset.upsert({
    where: { qrCode: "ACT-0042" },
    update: {},
    create: {
      name: "Laptop Dell XPS 15",
      description: "Laptop de alto rendimiento",
      serialNumber: "DLXPS-2024-0042",
      brand: "Dell",
      model: "XPS 15 9530",
      purchaseDate: new Date("2024-01-10"),
      purchasePrice: 35000,
      currentValue: 32000,
      status: "ASSIGNED",
      location: "Edificio A, Piso 3",
      qrCode: "ACT-0042",
      ensLevel: "MEDIUM",
      categoryId: laptops.id,
      securityUserId: admin.id,
    },
  });

  const monitor = await prisma.asset.upsert({
    where: { qrCode: "ACT-0123" },
    update: {},
    create: {
      name: 'Monitor Samsung 27"',
      description: "Monitor de alta resolución",
      serialNumber: "SAM-2024-0123",
      brand: "Samsung",
      model: "Odyssey G7",
      purchaseDate: new Date("2024-02-20"),
      purchasePrice: 12000,
      currentValue: 11000,
      status: "AVAILABLE",
      location: "Edificio B, Piso 1",
      qrCode: "ACT-0123",
      ensLevel: "BASIC",
      categoryId: monitores.id,
      securityUserId: admin.id,
    },
  });

  const vehiculo = await prisma.asset.upsert({
    where: { qrCode: "ACT-0156" },
    update: {},
    create: {
      name: "Camioneta Toyota Hilux",
      description: "Vehículo utilitario",
      serialNumber: "TOY-2024-0156",
      brand: "Toyota",
      model: "Hilux 4x4",
      purchaseDate: new Date("2024-01-05"),
      purchasePrice: 650000,
      currentValue: 620000,
      status: "ASSIGNED",
      location: "Estacionamiento",
      qrCode: "ACT-0156",
      ensLevel: "MEDIUM",
      categoryId: vehiculos.id,
      securityUserId: admin.id,
    },
  });

  console.log("✅ Datos de ejemplo creados correctamente");
  console.log(`- Departamentos: 3`);
  console.log(`- Categorías: 3`);
  console.log(`- Usuarios: 2`);
  console.log(`- Activos: 3`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
