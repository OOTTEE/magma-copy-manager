# Workflow: New Facade

Este flujo de trabajo automatiza la creación de una nueva fachada siguiendo la arquitectura de Magma.

## Instrucciones

1. **Contexto**: Leer ficheros `core/ARCHITECTURE.MD`, `core/TESTING.MD` y `core/GEMINI.md`.
2. **Habilidad**: Aplicar reglas de `facade-developer` definidas en `.agents/skills/facade-developer/SKILL.md`.
3. **Implementación**:
    * Crear directorio `core/facades/[nombre_dominio]`.
    * Crear fichero de lógica de fachada `[nombre_dominio].facade.ts`.
    * Crear fichero de tests co-ubicados `[nombre_dominio].facade.test.ts`.
4. **Verificación**: Ejecutar `npm run build` y `npm run test` para asegurar la integridad de la nueva fachada.

// turbo
5. Limpiar ficheros temporales si se crearon durante los tests.
