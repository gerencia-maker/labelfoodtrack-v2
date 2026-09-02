# LabelFoodTrack v2

Aplicación multiempresa para gestionar productos, generar e imprimir etiquetas de alimentos, registrar trazabilidad en bitácora y consultar información pública por QR.

## Versión documentada

| Dato | Valor |
| --- | --- |
| Versión | `2.0.0` |
| Revisión | `2026-09-02` |
| Rama de producción | `main` |
| Última versión funcional | [`c4fb529`](https://github.com/gerencia-maker/labelfoodtrack-v2/commit/c4fb529b7cd3af3fc7c6de7cd6a880687ca4ff9e) |
| Aplicación | [labelfoodtrack.com](https://labelfoodtrack.com) |
| Punto de restauración | [`restore-before-label-editor-redesign-20260902`](https://github.com/gerencia-maker/labelfoodtrack-v2/tree/restore-before-label-editor-redesign-20260902) |

### Cambios incluidos en esta revisión

- Espacio de producción de etiquetas rediseñado con formulario compacto y vista previa adaptable.
- Zoom de vista previa `Ajustar`, `50 %` y `100 %` sin alterar las dimensiones físicas de impresión.
- Perfil de impresión activo visible con tamaño, orientación y DPI.
- Flujo seguro de guardar antes de imprimir para utilizar el identificador QR generado por el servidor.
- Validación visible de producto, fecha y configuración de impresión.
- Navegación agrupada por Producción y Administración, con rutas activas consistentes.
- Endurecimiento de autorización por instancia, validaciones de entrada y acciones sensibles.
- Contenedor de producción corregido para evitar la generación de Prisma con permisos incorrectos durante el arranque.

### Historial reciente

| Commit | Cambio |
| --- | --- |
| [`c4fb529`](https://github.com/gerencia-maker/labelfoodtrack-v2/commit/c4fb529b7cd3af3fc7c6de7cd6a880687ca4ff9e) | Rediseño del espacio de producción de etiquetas. |
| [`94c8507`](https://github.com/gerencia-maker/labelfoodtrack-v2/commit/94c85074e85f47f8e15b65dd0f55bdf371fb4afc) | Ajuste de vista previa y activación del preset guardado. |
| [`45965fa`](https://github.com/gerencia-maker/labelfoodtrack-v2/commit/45965fa2428b0d77c681fbb732d6e2fb77a036a3) | Actualización del entorno de GitHub Actions. |
| [`385d34f`](https://github.com/gerencia-maker/labelfoodtrack-v2/commit/385d34f) | Refuerzo de seguridad y despliegue. |
| [`ddd7b6d`](https://github.com/gerencia-maker/labelfoodtrack-v2/commit/ddd7b6d) | Corrección del arranque de Prisma en el contenedor. |

Para volver al estado anterior al rediseño, se debe desplegar el tag de restauración o crear un commit de reversión. No es necesario reescribir el historial de `main`.

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
