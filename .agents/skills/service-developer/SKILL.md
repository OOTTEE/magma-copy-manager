# Skill: Service Developer

Este skill automatiza la creación de nuevos servicios siguiendo la arquitectura **Modulo-per-Folder** y las reglas de **Testing co-ubicado** del proyecto Magma.

## Objetivo

Generar un conjunto completo de ficheros para un nuevo servicio (Lógica, Tests y Documentación) de forma estandarizada.

---

## 🏗️ Reglas de Creación

Toda creación de servicio debe seguir inexorablemente estas pautas:

1. **Encapsulamiento**: Crear un directorio propio en `core/services/[dominio]/`.
2. **Lógica Core**: Fichero de servicio nombrado como `[dominio].service.ts`.
3. **Testing Co-ubicado**: **OBLIGATORIO** crear un archivo `[dominio].service.test.ts` en la misma carpeta.
4. **Responsabilidad del Test**: El test debe validar exhaustivamente:
    * Reglas de negocio puras (ej: cálculos de IVA, descuentos, estados permitidos).
    * Casos borde y manejo de excepciones.
    * Interacción con Repositorios (usando mocks del ORM).
    * **COBERTURA**: 100% en métodos públicos.
5. **Clean Code**: Seguir los principios de Responsabilidad Única y desacoplamiento definidos en `ARCHITECTURE.MD`.
6. **Independencia**: El servicio no debe conocer nada de la capa de transporte (HTTP/Fastify).

---

## 📋 Información Requerida

Para que Gemini pueda crear un servicio con éxito, el usuario debe proporcionar:

* **Nombre del Dominio**: (ej. `notifications`, `billing`).
* **Responsabilidades**: Breve descripción de qué hace el servicio.
* **Métodos Clave**: Listado de funciones, sus argumentos y la lógica esperada.
* **Dependencias**: Repositorios o servicios externos que necesita (consultar `GEMINI.md` para ver el modelo de datos).

---

## 📚 Ficheros de Contexto Obligatorios

Gemini **DEBE** leer y aplicar las reglas de estos ficheros antes de escribir código:

1. **[`core/ARCHITECTURE.MD`](file:///Users/ote/IdeaProjects/Magma/core/ARCHITECTURE.MD)**: Para las reglas de la capa de Service (independencia de transporte, DTOs, etc.).
2. **[`core/TESTING.MD`](file:///Users/ote/IdeaProjects/Magma/core/TESTING.MD)**: Para los estándares de Vitest y mocks.
3. **[`core/GEMINI.md`](file:///Users/ote/IdeaProjects/Magma/core/GEMINI.md)**: Para el dominio del negocio y stack tecnológico.

---

> "Crea un nuevo servicio para el dominio **[NOMBRE]** que se encargue de **[PROSITO]**. Sus métodos principales son **[METODOS]**. Depende de los repositorios **[REPOS]**. Sigue las reglas de `service-developer`."

## 🧪 Ejemplo de Test (Business Logic)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { billingService } from './billing.service';
import { invoiceRepository } from '../../repositories/invoice.repository';

// Mock del repositorio (Drizzle/Database abstraction)
vi.mock('../../repositories/invoice.repository', () => ({
  invoiceRepository: {
    create: vi.fn(),
    findByUser: vi.fn()
  }
}));

describe('Service: Billing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe calcular el total con IVA correctamente', async () => {
    const items = [
      { description: 'Impresión A4', amount: 10 },
      { description: 'Impresión A3', amount: 20 }
    ];
    
    const result = await billingService.calculateTotal(items);

    // Si IVA es 21%, total debe ser 36.3
    expect(result.subtotal).toBe(30);
    expect(result.total).toBe(36.3);
  });

  it('debe persistir la factura en la base de datos tras el cálculo', async () => {
    await billingService.generateInvoice('user-1', [{ amount: 100 }]);
    
    expect(invoiceRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-1',
      total: 121 // 100 + 21%
    }));
  });
});
```
