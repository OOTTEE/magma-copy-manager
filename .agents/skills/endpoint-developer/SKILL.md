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
5. **RESTful Compliance**: Seguir estrictamente las [🌍 Guías de Diseño RESTful](#-guías-de-diseño-restful-mandatorio).
6. **Validación y Seguridad**:
    * Usar `preValidation: [fastify.authenticate]` para rutas privadas.
    * Usar `fastify.requireRole('admin')` para acciones restringidas.
7. **Paso de Contexto**: Pasar siempre el objeto `request.user` a los métodos de la Fachada para que esta gestione la visibilidad ad-hoc de los recursos.
8. **Testing Co-ubicado**: **OBLIGATORIO** crear un archivo `index.test.ts` en el mismo directorio.

---

## 🌍 Guías de Diseño RESTful (Mandatorio)

Para mantener la coherencia y profesionalidad de la API de Magma, Gemini **DEBE** aplicar estas reglas:

### 1. Nombres y Recursos

* **Sustantivos en Plural**: Las rutas deben representar colecciones de recursos.
  * ✅ `/api/v1/users`, `/api/v1/invoices`, `/api/v1/copies`
  * ❌ `/api/v1/getUser`, `/api/v1/calculateInvoice`
* **Jerarquía (Nested Resources)**: Reflejar relaciones padre-hijo en la URL.
  * ✅ `/api/v1/users/:id/copies` (Copias que pertenecen a un usuario).

### 2. Métodos HTTP

* **GET**: Recuperar recursos. Sin efectos secundarios.
* **POST**: Crear nuevos recursos. Retorna `201 Created`.
* **PUT**: Reemplazo completo de un recurso. Idempotente.
* **PATCH**: Actualización parcial de un recurso.
* **DELETE**: Eliminación de un recurso. Retorna `204 No Content`.

### 3. Códigos de Estado Estándar

| Código | Significado en Magma |
| :--- | :--- |
| **200 OK** | Éxito en lectura o actualización. |
| **201 Created** | Recurso creado con éxito (POST). |
| **204 No Content** | Éxito sin cuerpo de respuesta (DELETE/PATCH). |
| **400 Bad Request** | Error de validación de datos (Input). |
| **401 Unauthorized** | Token JWT ausente o inválido. |
| **403 Forbidden** | Autenticado, pero sin permisos (o no es dueño del recurso). |
| **404 Not Found** | El recurso especificado no existe. |

---

## 📋 Información Requerida

Para crear un endpoint con éxito, Gemini debe conocer:

* **Recurso y Acción**: Qué objeto se manipula y qué se hace con él.
* **Ruta RESTful**: Definida según las guías anteriores.
* **Fachada a Invocar**: Qué Fachada y método se utilizará.
* **Esquema de Respuesta**: Qué modelo de `schemas.ts` se retornará.

---

## 📚 Ficheros de Contexto Obligatorios

Gemini **DEBE** leer y aplicar las reglas de estos ficheros:

1. **[`core/ARCHITECTURE.MD`](file:///Users/ote/IdeaProjects/Magma/core/ARCHITECTURE.MD)**: Especialmente la sección de la Capa 1 (API - Routes).
2. **[`core/routes/schemas.ts`](file:///Users/ote/IdeaProjects/Magma/core/routes/schemas.ts)**: Para identificar los esquemas disponibles.

---

## 🚀 Plantilla de Ejemplo (RESTful)

```typescript
import { FastifyPluginAsync } from 'fastify';
import { usersFacade } from '../../../../facades/users/users.facade';
import { errorSchema, userSchema } from '../../../../schemas';

const usersRoute: FastifyPluginAsync = async (fastify) => {
  // GET /api/v1/users/:userId
  fastify.get<{ Params: { userId: string } }>('/:userId', {
    schema: {
        description: 'Obtiene el perfil de un usuario específico',
        tags: ['Users'],
        params: { type: 'object', properties: { userId: { type: 'string' } } },
        response: {
            200: userSchema,
            403: errorSchema,
            404: errorSchema
        }
    },
    preValidation: [fastify.authenticate]
  }, async (request, reply) => {
    const requestingUser = request.user as { id: string, role: string };
    const { userId } = request.params;
    
    try {
      const result = await usersFacade.getUserProfile(requestingUser, userId);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        trace_id: request.id,
        message: error.message
      });
    }
  });
};

export default usersRoute;
```
