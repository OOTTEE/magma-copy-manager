# Skill: Facade Developer

Este skill automatiza la creación de nuevas **Fachadas (Facades)** en el proyecto Magma, asegurando que se cumplan las reglas de orquestación y control de acceso a recursos.

## Objetivo

Generar la estructura de archivos necesaria para una nueva Fachada, integrando lógica de visibilidad ad-hoc y orquestación de servicios.

---

## 🏗️ Reglas de Creación

Toda creación de fachada debe seguir estas pautas:

1. **Encapsulamiento**: Crear un directorio propio en `core/facades/[dominio]/`.
2. **Lógica Facade**: Fichero nombrado como `[dominio].facade.ts`.
3. **Aislamiento de BD**: **PROHIBIDO** el acceso directo a repositorios. Siempre debe consumir la capa de `Service`.
4. **Control de Acceso**: La fachada es responsable de validar si el usuario (proporcionado como argumento) tiene permisos sobre el recurso específico (ej: "solamente el dueño puede borrar sus datos").
5. **Independencia de Transporte**: No debe referenciar objetos de Fastify (`Request`, `Reply`). Debe trabajar con DTOs y tipos de datos puros.
6. **Testing Co-ubicado**: **OBLIGATORIO** crear un archivo `[dominio].facade.test.ts` en la misma carpeta. El test debe validar:
    * El mapeo correcto de DTOs y tipos de datos.
    * Las reglas de visibilidad y acceso (ej: un usuario 'customer' no puede ver datos de otro).
    * La orquestación correcta de llamadas a Services (usando mocks).

---

## 📋 Información Requerida

Para que Gemini pueda crear una fachada con éxito, el usuario debe proporcionar:

* **Nombre del Dominio**: (ej. `invoices`, `users`).
* **Servicios Involucrados**: Cuáles son los servicios que la fachada orquestará.
* **Reglas de Visibilidad**: Definir quién puede realizar cada acción (ej. Al leer, "solo el dueño o admin").
* **Acciones**: Listado de métodos a exponer a la capa de API.

---

## 📚 Ficheros de Contexto Obligatorios

Gemini **DEBE** leer y aplicar las reglas de estos ficheros antes de escribir código:

1. **[`core/ARCHITECTURE.MD`](file:///Users/ote/IdeaProjects/Magma/core/ARCHITECTURE.MD)**: Especialmente la sección de la Capa 2 (Facade).
2. **[`core/TESTING.MD`](file:///Users/ote/IdeaProjects/Magma/core/TESTING.MD)**: Para los estándares de Vitest y mocks.

---

> "Crea una nueva fachada para el dominio **[NOMBRE]** que orqueste los servicios **[SERVICIOS]**. La regla de visibilidad es que **[REGLA]**. Sigue las reglas de `facade-developer`."

## 🧪 Ejemplo de Test (RBAC & Orchestration)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userFacade } from './user.facade';
import { userService } from '../../services/user/user.service';

// Mock de servicios dependientes
vi.mock('../../services/user/user.service', () => ({
  userService: {
    getById: vi.fn(),
    delete: vi.fn()
  }
}));

describe('Facade: User', () => {
  const adminUser = { id: 'admin-1', role: 'admin' };
  const customerUser = { id: 'cust-1', role: 'customer' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe permitir a un admin eliminar cualquier usuario', async () => {
    await userFacade.deleteAccount(adminUser, 'cust-2');
    expect(userService.delete).toHaveBeenCalledWith('cust-2');
  });

  it('debe permitir a un customer eliminar su propia cuenta', async () => {
    await userFacade.deleteAccount(customerUser, 'cust-1');
    expect(userService.delete).toHaveBeenCalledWith('cust-1');
  });

  it('debe lanzar error 403 si un customer intenta eliminar otra cuenta', async () => {
    await expect(userFacade.deleteAccount(customerUser, 'cust-2'))
      .rejects.toThrow('No tienes permisos para realizar esta acción');
    expect(userService.delete).not.toHaveBeenCalled();
  });
});
```
