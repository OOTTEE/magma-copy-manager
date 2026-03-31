# Skill: Endpoint Developer

Este skill automatiza la creación de nuevos endpoints de API en Magma, asegurando el cumplimiento de la arquitectura de capas y la homogeneización de respuestas mediante esquemas compartidos.

## Objetivo

Generar controladores de ruta (Fastify) que actúen como adaptadores delgados, delegando la lógica y seguridad a la capa **Facade**.

---

## 🏗️ Reglas de Implementación

Toda creación de endpoint debe seguir estas pautas:

1. **Directorio**: Los endpoints se ubican en `core/routes/` siguiendo la jerarquía de la URL (Autoloading).
2. **Naming**: El punto de entrada es siempre `index.ts`.
3. **Jerarquía de Llamadas**: **PROHIBIDO** llamar a Servicios o Repositorios. Un Endpoint **SOLO** puede llamar a una **Fachada (Facade)**.
4. **Reutilización de Esquemas**: **OBLIGATORIO** importar y reutilizar esquemas de `core/routes/schemas.ts` para las respuestas (`response`) y el cuerpo (`body`), manteniendo la consistencia de la API.
5. **Validación y Seguridad**:
    * Usar `preValidation: [fastify.authenticate]` para rutas privadas.
    * Usar `fastify.requireRole('admin')` para acciones restringidas.
6. **Paso de Contexto**: Pasar siempre el objeto `request.user` a los métodos de la Fachada para que esta gestione la visibilidad ad-hoc de los recursos.

---

## 📋 Información Requerida

Para crear un endpoint con éxito, Gemini debe conocer:

* **Ruta HTTP y Método**: (ej: `GET /api/v1/users/:userId/invoices`).
* **Fachada a Invocar**: Qué Fachada y método se utilizará.
* **Esquema de Respuesta**: Qué modelo de `schemas.ts` se retornará (User, Copy, Invoice, etc.).
* **Permisos**: Si requiere autenticación o roles específicos.

---

## 📚 Ficheros de Contexto Obligatorios

Gemini **DEBE** leer y aplicar las reglas de estos ficheros:

1. **[`core/ARCHITECTURE.MD`](file:///Users/ote/IdeaProjects/Magma/core/ARCHITECTURE.MD)**: Especialmente la sección de la Capa 1 (API - Routes).
2. **[`core/routes/schemas.ts`](file:///Users/ote/IdeaProjects/Magma/core/routes/schemas.ts)**: Para identificar los esquemas disponibles.

---

## 🚀 Plantilla de Ejemplo

```typescript
import { FastifyPluginAsync } from 'fastify';
import { dominioFacade } from '../../../../facades/dominio/dominio.facade';
import { errorSchema, modelSchema } from '../../../../schemas';

const endpointRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { id: string } }>('/:id', {
    schema: {
        description: 'Descripción del endpoint',
        tags: ['Dominio'],
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: {
            200: modelSchema,
            401: errorSchema,
            500: errorSchema
        }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const user = request.user as { id: string, role: string };
    try {
      const result = await dominioFacade.getById(user, request.params.id);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        trace_id: request.id,
        error_type: "error",
        message: error.message
      });
    }
  });
};

export default endpointRoute;
```
