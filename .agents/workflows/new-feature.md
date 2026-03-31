# Workflow: New Feature (End-to-End Generator)

Este flujo de trabajo permite generar una funcionalidad completa de negocio, coordinando todas las capas de la arquitectura Magma.

## Instrucciones

1. **Contexto**: Leer ficheros `core/ARCHITECTURE.MD`, `core/routes/schemas.ts` y `core/GEMINI.md`.
2. **Análisis**: Entender la feature a generar y definir los permisos necesarios (RBAC y Ad-hoc).
3. **Contrato**: Definir los modelos de entrada/respuesta y añadirlos o actualizarlos en [`core/routes/schemas.ts`](file:///Users/ote/IdeaProjects/Magma/core/routes/schemas.ts).
4. **Capa de Negocio (Service)**: Crear o ampliar el servicio necesario siguiendo `service-developer`.
5. **Capa de Seguridad y Orquestación (Facade)**: Crear o ampliar la Fachada necesaria siguiendo `facade-developer`. Implementar las reglas de visibilidad ad-hoc.
6. **Capa de Interfaz (API - Routes)**: Crear el endpoint `index.ts` siguiendo `endpoint-developer`.
7. **Capa de Testing**: Generar tests unitarios para Service y Facade, y tests de integración para el Endpoint.
8. **Verificación**: Ejecutar `npm run build` y `npm run test` para asegurar que la nueva funcionalidad cumple con los contratos y reglas de seguridad.

// turbo
9. Limpiar ficheros temporales si se crearon durante los tests.
