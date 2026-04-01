---
description: Comando para analizar e iniciar el desarrollo de una nueva funcionalidad en Magma.
---

# Workflow: Nueva Funcionalidad (/new-feature)

Este flujo de trabajo activa al **Arquitecto de Funcionalidades** para realizar un análisis de impacto y proponer un plan de implementación validado antes de cualquier cambio en el código.

## 📋 Pasos del Proceso

1. **Invocación**: El usuario lanza el comando con una descripción inicial: `/new-feature [DESCRIPCIÓN]`.
2. **Descubrimiento (Brainstorming)**:
   - El asistente leerá la definición de la skill [`feature-architect`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/feature-architect/SKILL.md).
   - Realizará preguntas de aclaración si la descripción es incompleta.
3. **Análisis de Impacto**:
   - Investigación en Core y App para detectar dependencias.
   - Evaluación obligatoria de **Breaking Changes** y **Security Assessment**.
4. **Propuesta Estructurada**:
   - Generación automática del artefacto `implementation_plan.md`.
5. **Validación**:
   - El asistente **DEBE DETENERSE** y pedir aprobación al usuario.

---

## 🚀 Uso del Comando

Ejemplo:

```text
/new-feature "Integrar sistema de facturación con Nexudus API"
```

El asistente responderá con las fases de la skill y comenzará la fase de descubrimiento.
