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
6. **Testing Co-ubicado**: Fichero de test nombrado como `[dominio].facade.test.ts` en la misma carpeta, utilizando Vitest y mocks para los servicios.

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

## 🚀 Comando de Ejemplo

Usa este formato para solicitar una nueva fachada:

> "Crea una nueva fachada para el dominio **[NOMBRE]** que orqueste los servicios **[SERVICIOS]**. La regla de visibilidad es que **[REGLA]**. Sigue las reglas de `facade-developer`."
