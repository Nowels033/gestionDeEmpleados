# AssetOne

Sistema web para gestion de activos empresariales, asignaciones, usuarios, departamentos y reportes.

## Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Prisma + PostgreSQL
- Tailwind CSS + Radix UI

## Requisitos

- Node.js 20+
- npm 10+ recomendado
- PostgreSQL (local o cloud)

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

Si usas Supabase, usa:

- `DATABASE_URL` con `pooler` (puerto 6543)
- `DIRECT_URL` con `session pooler` (mismo host `pooler`, puerto 5432)

Prisma usa `DIRECT_URL` para operaciones de schema (`db push`, migraciones) y evita bloqueos del transaction pooler.

Para generar `NEXTAUTH_SECRET` puedes usar:

```bash
openssl rand -base64 32
```

## Comandos

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Usuario demo (despues de seed):

- email: `admin@empresa.com`
- password: `admin12345`

Comandos de calidad:

```bash
npm run lint
npm run typecheck
npm run build
```

## Estado actual

- API con validacion de entrada en endpoints principales (Zod).
- Hash de contrasena con bcrypt en creacion de usuarios.
- Asignaciones con transaccion para mantener consistencia de datos.
- Autenticacion real con NextAuth (Credentials + JWT).
- Middleware para proteger rutas privadas y APIs.

## Configuracion gratuita recomendada

- Frontend: Vercel Hobby (free).
- Base de datos: Supabase o Neon (free tier).
- Dominio: usar subdominio gratis de Vercel al inicio.
- Monitoreo inicial: logs de plataforma (sin costo).

## Roadmap corto

1. Integrar autenticacion real con NextAuth (v5).
2. Proteger rutas API por rol (ADMIN, EDITOR, USER).
3. Migrar todas las vistas que aun usan datos mock a backend real.
4. Agregar pruebas unitarias, integracion y e2e.
5. Configurar CI/CD con GitHub Actions.
