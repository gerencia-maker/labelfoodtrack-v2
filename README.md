# LabelFoodTrack v2

Aplicación multiempresa para gestionar productos, generar e imprimir etiquetas de alimentos, registrar trazabilidad en bitácora y consultar información pública por QR.

## Funcionalidades

- Catálogo de productos con vida útil por cadena de frío e información nutricional.
- Creación, previsualización e impresión de etiquetas con presets configurables.
- Bitácora de producción, exportación CSV/XLSX y seguimiento de vencimientos.
- Aislamiento de datos por instancia y roles `ADMIN`, `EDITOR` y `VIEWER`.
- Permisos granulares por módulo y acción.
- Autenticación con Firebase y persistencia en PostgreSQL mediante Prisma.
- Consulta pública de lotes por QR.
- FoodBot con contexto de productos y bitácora de la instancia seleccionada.
- Sincronización de productos desde Google Sheets e importación desde hojas de cálculo.

## Arquitectura

- Next.js 16 con App Router, React 19 y TypeScript estricto.
- Rutas de API en `src/app/api`.
- Componentes y pantallas en `src/components` y `src/app/(dashboard)`.
- Autenticación, autorización y utilidades compartidas en `src/lib`.
- PostgreSQL y esquema Prisma en `prisma/schema.prisma`.
- Firebase Authentication para identidad; Firebase Admin valida los tokens en el servidor.
- Cloudinary para logos y OpenAI para FoodBot.

## Desarrollo local

Requisitos: Node.js 20 o superior y PostgreSQL 16.

```bash
npm ci
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

En PowerShell, usa `Copy-Item .env.example .env` en lugar de `cp`.

El modo demo solo se activa cuando `NEXT_PUBLIC_DEMO_MODE=true`. Si está desactivado y falta `FIREBASE_SERVICE_ACCOUNT`, las rutas protegidas rechazan el acceso.

## Variables de entorno

Consulta `.env.example` para la lista completa. Las variables indispensables en producción son:

- `DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `POSTGRES_PASSWORD` al usar Docker Compose de producción

Las integraciones de IA, chatbot y carga de logos requieren sus respectivas claves de OpenAI, chatbot y Cloudinary.

## Verificación

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm ci` ejecuta `prisma generate` automáticamente mediante `postinstall`.

## Docker

```bash
docker compose up --build
```

Para producción:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Al arrancar, el contenedor sincroniza el esquema con `prisma db push` y detiene el inicio si la sincronización falla. Nunca acepta pérdida de datos automáticamente.

## Modelo de acceso

- Un usuario normal solo puede consultar y modificar registros de su `instanceId`.
- Un usuario sin instancia asignada no obtiene acceso global.
- Un superadministrador es un usuario `ADMIN` sin instancia fija y puede seleccionar una instancia mediante la cookie `lft-instance-id`.
- Ocultar una acción en la interfaz no sustituye la autorización: las rutas de API validan módulo, acción e instancia.

## Operación

Para promover un usuario existente a superadministrador:

```bash
npx tsx scripts/promote-super-admin.ts usuario@empresa.com
```

No habilites el modo demo en producción. Rota las credenciales si alguna clave privada se expone y revisa periódicamente `npm audit`.
