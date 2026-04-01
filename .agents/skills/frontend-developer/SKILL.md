---
name: frontend-developer
description: Expert in React, TypeScript, and TailwindCSS development following the Magma architecture. Focused on modular features, premium UI aesthetics, and clean state management with Zustand.
---

# Frontend Developer Skill: Magma UI Architecture

Este experto define las reglas de oro y la organización técnica para el desarrollo de la interfaz de usuario en el proyecto Magma, priorizando la mantenibilidad, escalabilidad y una experiencia de usuario premium.

## 🏗️ Technical Architecture (Layering)

Toda implementación de UI debe seguir estrictamente esta jerarquía de capas:

### 1. Layouts (`src/layouts/`)

- Corresponden al esqueleto global de la aplicación (Header, Sidebar, Content Area).
- No deben contener lógica de dominio específica, solo orquestación visual.
- Utilizan `Outlet` de `react-router-dom` para la inyección de contenido dinámico.

### 2. Features (`src/features/*/`)

- Organización modular por dominios de negocio (ej: `auth`, `reports`, `users`).
- Cada feature es autónoma e incluye sus propios:
  - `components/`: UI específica de la funcionalidad.
  - `hooks/`: Lógica de negocio y gestión de efectos.
  - `services/`: Definición de peticiones a la API del dominio.

### 3. Components (`src/components/`)

- Componentes atómicos y ciegos (Button, Input, Badge, Card).
- Reciben datos por `props` y no tienen conocimiento de la API ni del estado global.

### 4. Application Logic (`src/hooks/` & `src/store/`)

- **Global State**: Gestión centralizada con **Zustand**. No abusar de `useState` para datos compartidos.
- **Persistence**: El `authStore` debe persistir el JWT en localStorage mediante middleware.
- **Hooks Reutilizables**: Encapsulan lógica de UI genérica (ej: `useDarkMode`, `useDebounce`).

### 5. Data Access (`src/services/api/`)

- **API Client**: Instancia centralizada de fetch/axios con interceptores de autenticación.
- **Typed Services**: Todas las llamadas a API deben estar tipadas (Request/Response) para garantizar seguridad en tiempo de compilación.

---

## 🔝 Reglas de Oro de Implementación

1. **Mobile First & Responsive**: Todo diseño debe ser `mobile-first` utilizando los breakpoints de Tailwind (`sm:`, `md:`, `lg:`, `xl:`).
2. **Type Safety Absolute**: Prohibido el uso de `any`. Se deben definir interfaces claras para props y datos de negocio.
3. **Premium UI (Aesthetics)**:
   - Uso de **HSL** para colores variables (permite manipulación dinámica de opacidad y luminosidad).
   - **Micro-animaciones**: Uso de transiciones suaves (`transition-all`, `duration-300`) y hover effects consistentes.
   - **Glassmorphism**: En cuadros de mando y diálogos, usar `bg-opacity` y `backdrop-blur`.
4. **Separation of Concerns**: Un componente JSX debe ser mayoritariamente declarativo. La lógica pesada de datos debe salir a un Hook o Service.
5. **Dark Mode Native**: Soporte de primera clase mediante la clase `.dark`. Verificar contraste y legibilidad en ambos temas.
6. **Defensive Programming (API Resilience)**: Prohibido confiar ciegamente en la API. Usar siempre `?.` (optional chaining) y `|| ""` o `??` (nullish coalescing) al acceder a propiedades de datos externos para evitar "white screens" por datos nulos o inesperados.

---

## 🛠️ Workflow de Creación de una Pantalla

1. **Definir Ruta**: Configurar el Router en `App.tsx` o routing config.
2. **Identificar Layout**: Decidir si usa `DashboardLayout` o `AuthLayout`.
3. **Crear Feature Module**: Si no existe, crear `src/features/[feature-name]`.
4. **Implementar Service**: Definir la llamada a la API necesaria.
5. **Implementar UI**: Crear componentes en la feature y unirlos en la `Page` principal del módulo.
6. **Inyectar Estado**: Conectar el `store` de Zustand si es necesario para datos compartidos.
