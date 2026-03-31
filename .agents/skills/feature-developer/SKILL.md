# Skill: Feature Developer (Master Orchestrator)

Este skill es el orquestador maestro para la creación de funcionalidades de negocio completas ("features"). Coordina la generación de código en las tres capas principales: API, Facade y Service.

## Objetivo

Implementar una funcionalidad de negocio de extremo a extremo, asegurando la consistencia de datos, la seguridad en todos los niveles y la cobertura de tests.

---

## 🏗️ Reglas de Generación Integral

Para generar una feature completa, Gemini debe seguir este flujo lógico:

1. **Definición de Contrato (Schemas)**:
    * Analizar el modelo de datos de entrada y salida.
    * Si no existen, añadir los esquemas necesarios a [`core/routes/schemas.ts`](file:///Users/ote/IdeaProjects/Magma/core/routes/schemas.ts).

2. **Capa de Persistencia y Lógica Base (Service)**:
    * Reutilizar servicios existentes si es posible.
    * Si se requiere lógica nueva, crear un nuevo servicio siguiendo `service-developer`.
    * **Prohibido**: Lógica de visibilidad o de transporte en esta capa.

3. **Capa de Orquestación y Seguridad (Facade)**:
    * Crear o actualizar la Fachada siguiendo `facade-developer`.
    * **Crucial**: Definir la lógica de permisos "ad-hoc" (ej: "¿puede este usuario acceder a este recurso específico?").
    * Orquestar las llamadas a los servicios necesarios.

4. **Capa de Interfaz (API - Routes)**:
    * Crear el endpoint en `core/routes/` siguiendo `endpoint-developer`.
    * Configurar `preValidation` para roles globales (RBAC).
    * Consumir los esquemas compartidos definidos en el paso 1.

5. **Estrategia de Testing**:
    * Generar tests unitarios para el Service (Lógica core).
    * Generar tests unitarios para la Facade (Seguridad y Orquestación).
    * Generar tests de integración para el Endpoint (HTTP y Contrato).

---

## 📋 Información Requerida

Para ejecutar `/new-feature`, el usuario debe proporcionar:

* **Nombre de la Feature**: (ej. "Descargar factura PDF", "Listar copias mensuales").
* **Descripción de Negocio**: Qué persigue la funcionalidad.
* **Actores y Permisos**: Quién puede usarla y qué restricciones "ad-hoc" aplican.
* **Estructura de Datos**: Campos de entrada y formato de respuesta.

---

## 📚 Ficheros de Referencia

* [`core/ARCHITECTURE.MD`](file:///Users/ote/IdeaProjects/Magma/core/ARCHITECTURE.MD)
* [`core/routes/schemas.ts`](file:///Users/ote/IdeaProjects/Magma/core/routes/schemas.ts)
* [`core/GEMINI.md`](file:///Users/ote/IdeaProjects/Magma/core/GEMINI.md)
