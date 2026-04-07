# Frontend Layer: APP

Esta capa corresponde a la interfaz de usuario (UI) del sistema Magma, construida como una Single Page Application (SPA) moderna, responsiva y con una estética premium.

## Stack Tecnológico

- **Core**: React 18+ con TypeScript.
- **Build Tool**: Vite (para un desarrollo ultra-rápido).
- **Styling**: TailwindCSS (Utility-first CSS) con soporte nativo para **Dark Mode** (clase `.dark`).
- **Icons**: Lucide React.
- **State Management**: **Zustand** (Gestiona el estado global de autenticación, preferencias y UI).
- **Navigation**: React Router (para la gestión de rutas del lado cliente).

---

## Arquitectura Técnica

La estructura de directorios sigue un patrón modular por funcionalidades:

```text
app/
├── src/
│   ├── components/     # Componentes atómicos de UI (Button, Input, Card)
│   ├── features/       # Módulos por dominio (auth, users, copies, reports)
│   ├── hooks/          # Hooks personalizados reutilizables
│   ├── services/       # Clientes de API y tipos de datos de red
│   ├── store/          # Almacenes de Zustand (authStore, uiStore)
│   ├── layouts/        # Plantillas de página (DashboardLayout, AuthLayout)
│   ├── pages/          # Vistas de la aplicación basadas en rutas
│   ├── utils/          # Funciones auxiliares y formateadores
│   └── styles/         # Configuraciones globales de CSS y temas
└── public/             # Activos estáticos (favicon.png, logos)
```

---

## 🔝 Reglas de Oro de Implementación

1. **Mobile First**: Todo componente debe ser diseñado pensando en móvil primero y escalando mediante breakpoints de Tailwind.
2. **Type Safety**: No se permite el uso de `any`. Todas las props de componentes y respuestas del backend deben estar tipadas.
3. **Aesthetics (Premium UI)**:
   - Uso de **HSL** para la definición de paletas de colores armónicas.
   - Implementación de **Micro-animaciones** y transiciones suaves para hover y estados de carga.
   - **Glassmorphism**: Uso de efectos de transparencia y desenfoque (backdrop-blur) en paneles flotantes.
4. **Unidireccionalidad**: El estado global reside en Zustand. Los componentes solo deben reaccionar a cambios de estado o disparar acciones.
5. **Dark Mode**: Se debe garantizar la legibilidad y estética premium tanto en modo claro como oscuro mediante el prefijo `dark:` de Tailwind.

---

## Funcionalidades del Frontend

### 1. Pantalla de Login

- **Diseño**: Panel flotante centrado vertical y horizontalmente.
- **Estética**: Fondo con gradiente dinámico y panel con efecto de cristal.
- **Campos**: User, Password y botón de Login.
- **Lógica**: Gestión de errores en tiempo real y persistencia del token en el `authStore`.
- **Credenciales de Prueba**: Para facilitar el testing de la interfaz:
  - **admin**: `m4gm4` (Rol: admin)
  - **Ote**: `changeme` (Rol: customer)
  - **Planb**: `changeme` (Rol: customer, Usuario configurado con copia sin papel)

---

### 2. Dashboard (Sistema de Gestión)

- **Dashboard Layout**: El contenedor principal que orquesta la navegación.
- **Lateral Bar (Sidebar)**:
  - Colapsable, optimizando el espacio de trabajo.
  - Sección Superior: Logo y Toggle de colapso.
  - Sección Media: Menú vertical (Usuarios, Monthly Report, Settings).
  - Sección Inferior: Mini-perfil de usuario con nombre y botón de Logout.
- **Main Screen (Content Area)**:
  - Carga dinámica de las vistas seleccionadas en la Sidebar.
  - Header superior persistente con el título de la sección y selector de Dark Mode.

### 3. Gestión de Usuarios (Admin Only)

- **Acceso**: Ruta `/users`, protegida mediante `RoleGuard`. Visible solo para el rol `admin`.
- **Doble Visualización**: Selector para alternar entre vista de **Tabla** (administrativa) y **Tarjetas** (visual/cuadrícula).
- **Búsqueda Avanzada**: Filtrado en tiempo real por nombre de usuario, identificador de impresora o ID de Nexudus.
- **Panel de Edición**:
  - Diseño: Modal flotante con efecto Glassmorphism y desenfoque de fondo.
  - Campos Editables: Nombre de usuario, ID de Impresora, ID de Nexudus.
  - Seguridad: Cambio de contraseña ciego (write-only) con campo de verificación y toggle de visibilidad (icono de ojo).
- **Sincronización**: Integración directa con `PATCH /api/v1/users/{id}` para persistencia inmediata sin recarga de página.
