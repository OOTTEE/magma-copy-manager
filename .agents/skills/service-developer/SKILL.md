# Skill: Service Developer

Este skill automatiza la creación de nuevos servicios siguiendo la arquitectura **Modulo-per-Folder** y las reglas de **Testing co-ubicado** del proyecto Magma.

## Objetivo
Generar un conjunto completo de ficheros para un nuevo servicio (Lógica, Tests y Documentación) de forma estandarizada.

---

## 🏗️ Reglas de Creación

Toda creación de servicio debe seguir inexorablemente estas pautas:

1.  **Encapsulamiento**: Crear un directorio propio en `core/services/[dominio]/`.
2.  **Lógica Core**: Fichero de servicio nombrado como `[dominio].service.ts`.
3.  **Testing Co-ubicado**: Fichero de test nombrado como `[dominio].service.test.ts` en la misma carpeta.
4.  **Documentación Técnica**: Fichero markdown nombrado como `[DOMINIO]_SERVICE.MD` con el diseño técnico.
5.  **Clean Code**: Seguir los principios de Responsabilidad Única y desacoplamiento definidos en `ARCHITECTURE.MD`.
6.  **Tests Robustos**: Implementar al menos un test unitario por cada método público utilizando Vitest y mocks según `TESTING.MD`.

---

## 📋 Información Requerida

Para que Gemini pueda crear un servicio con éxito, el usuario debe proporcionar:

*   **Nombre del Dominio**: (ej. `notifications`, `billing`).
*   **Responsabilidades**: Breve descripción de qué hace el servicio.
*   **Métodos Clave**: Listado de funciones, sus argumentos y la lógica esperada.
*   **Dependencias**: Repositorios o servicios externos que necesita (consultar `GEMINI.md` para ver el modelo de datos).

---

## 📚 Ficheros de Contexto Obligatorios

Gemini **DEBE** leer y aplicar las reglas de estos ficheros antes de escribir código:

1.  **[`core/ARCHITECTURE.MD`](file:///Users/ote/IdeaProjects/Magma/core/ARCHITECTURE.MD)**: Para las reglas de la capa de Service (independencia de transporte, DTOs, etc.).
2.  **[`core/TESTING.MD`](file:///Users/ote/IdeaProjects/Magma/core/TESTING.MD)**: Para los estándares de Vitest y mocks.
3.  **[`core/GEMINI.md`](file:///Users/ote/IdeaProjects/Magma/core/GEMINI.md)**: Para el dominio del negocio y stack tecnológico.

---

## 🚀 Comando de Ejemplo

Usa este formato para solicitar un nuevo servicio:

> "Crea un nuevo servicio para el dominio **[NOMBRE]** que se encargue de **[PROSITO]**. Sus métodos principales son **[METODOS]**. Depende de los repositorios **[REPOS]**. Sigue las reglas de `service-developer`."
