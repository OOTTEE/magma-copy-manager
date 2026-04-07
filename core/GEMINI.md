# Proyecto: Magma Copy Counter

## Descripción

**Magma** es un proyecto para desplegar una aplicación web (API + aplicación web) que ayudará a gestionar las operaciones internas de un espacio de coworking.

## Descripción de Funcionalidades

- Scraping del conteo de copias para los usuarios de impresión desde el servidor de impresión.
- Almacenamiento en una base de datos de un historial de copias en registros (A4_BW, A4_COLOR, A3_BW, A3_COLOR).
- Creación de un resumen mensual de las copias de los usuarios por categoría (A4_BW, A4_COLOR, A3_BW, A3_COLOR, SRA3_BW, SRA3_COLOR).
- Creación de una vista previa de la factura mensual para cada usuario con el coste total de sus copias.
- Envío de la factura mensual a Nexudus y persistencia de los datos.
- Validación interactiva de credenciales de Nexudus (Test de Conexión) desde el panel de ajustes.

## Stack Tecnológico

La aplicación se construirá utilizando las siguientes tecnologías:

### Backend

- NPM
- Node + TypeScript
- Fastify + OpenAPI
- Drizzle + SQLite
- Cliente API de Nexudus

### Frontend

- NPM
- React + TypeScript
- Vite
- TailwindCSS

---

## Convenciones de Desarrollo

- Seguir las convenciones estándar del lenguaje y framework elegidos.
- Mantener un historial de Git limpio.
- Para el backend, utilizar el rol de `endpoint-developer`.
- **Logging**: Queda estrictamente prohibido el uso de `console.log` en el backend (`core/`). Se debe utilizar exclusivamente el logger singleton exportado en `core/lib/logger.ts` (basado en Pino). Esto garantiza que todos los logs sean estructurados, incluyan niveles correctos y sigan la configuración del sistema.

---

## Lógica de Negocio / Dominio

- Solo existirá un único usuario administrador, el cual se creará automáticamente al desplegar la aplicación.
- El usuario administrador tendrá acceso a todas las funcionalidades de la aplicación.
- El usuario administrador podrá crear, actualizar, eliminar y listar a todos los usuarios.
- El sistema tendrá dos tipos de usuarios: "admin" y "customer".
- Cada cliente tendrá las propiedades "printUser" y "nexudusUser". "printUser" es el usuario que se utilizará para autenticarse con el servidor de impresión. "nexudusUser" es el usuario que se utilizará para autenticarse con la API de Nexudus.
- **Nexudus First**: El sistema no gestiona facturas locales propias. La persistencia de la facturación se delega a Nexudus ("Sales"), y Magma mantiene un mapeo (`nexudus_sale_id`) en cada registro de copia para asegurar que ninguna copia se facture dos veces.
- **Gestión de Secretos**: Las credenciales sensibles (tokens, contraseñas) se almacenan encriptadas (AES-256-CBC) en la base de datos de ajustes. Al recuperarlas para la UI, se enmascaran con `********`. El sistema es capaz de detectar esta máscara para evitar sobrescribir valores reales durante pruebas o actualizaciones parciales.
- **Autenticación Nexudus (OAuth2)**: La comunicación con la API v3 de Nexudus se realiza obligatoriamente mediante el flujo **OAuth2 Password Grant** (endpoint `/api/token`). Este método requiere el envío de credenciales en formato `application/x-www-form-urlencoded` y proporciona un `access_token` robusto que permite el acceso a recursos del sistema (`/api/sys/*`) sin errores de autorización. Se prefiere este modelo sobre el token de sesión simple de usuario.
- **Creación de Usuarios**: Los usuarios NO se crean manualmente desde Magma. Los nuevos usuarios se crean en la impresora física y aparecerán automáticamente en el sistema tras el proceso de sincronización.
- **Credenciales de Prueba (Entorno de Desarrollo)**: Para facilitar el testing y la automatización, existen los siguientes usuarios pre-configurados:
  - **admin**: `m4gm4` (Rol: admin)
  - **Ote**: `changeme` (Rol: customer)
  - **Planb**: `changeme` (Rol: customer, Usuario configurado con copia sin papel)

---

### Layering Backend

- routes: Rutas de la API.
- services: Lógica de negocio comercial.
- repositories: Acceso a datos.
- db: Esquema y conexión de la base de datos.
- facades: Capa de orquestación de servicios ad-hoc.
- config: Configuración.
- middleware: Middleware de Fastify.

---

### Estructura de Carpetas

```text
root/
├── core/               # Aplicación backend
│   ├── routes/         # Rutas de la API
│   ├── services/       # Lógica de negocio
│   ├── repositories/   # Capa de datos
│   ├── db/             # Esquema Drizzle
│   ├── facades/        # Orquestación
│   ├── config/         # Configuración
│   └── middleware/     # Middlewares
└── app/                # Aplicación frontend
```

---

## Modelos de Datos

### Usuario (User)

- id: string (uuid)
- username: string
- role: enum (admin, customer)
- printUser: string
- nexudusUser: string

### Registro de Copias (CopyRecord)

- id: string (uuid)
- userId: string
- nexudusSaleId: string (referencia a la venta en Nexudus, NULL si está pendiente)
- datetime: string (iso date)
- a4Color: number
- a4Bw: number
- a3Color: number
- a3Bw: number
- a4ColorTotal: number (contador acumulado de la impresora)
- a4BwTotal: number (contador acumulado de la impresora)
- a3ColorTotal: number (contador acumulado de la impresora)
- a3BwTotal: number (contador acumulado de la impresora)
