---
description: Comando para generar un nuevo servicio con arquitectura Modulo-per-Folder
---

1.  **Contexto**: Leer ficheros `core/ARCHITECTURE.MD`, `core/TESTING.MD` y `core/GEMINI.md`.
2.  **Habilidad**: Aplicar reglas de `service-developer` definidas en `.agents/skills/service-developer/SKILL.md`.
3.  **Implementación**:
    *   Crear directorio `core/services/[nombre_dominio]`.
    *   Crear fichero de lógica `[nombre_dominio].service.ts`.
    *   Crear fichero de tests `[nombre_dominio].service.test.ts`.
    *   Crear documentación técnica `[NOMBRE]_SERVICE.MD` (incluyendo análisis de fallos e integraciones).
4.  **Verificación**: Ejecutar `npm run build` y `npm run test` para asegurar la integridad.

// turbo
5.  Limpiar directorios temporales si se crearon durante los tests.
