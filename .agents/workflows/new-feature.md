---
description: Comando para analizar, diseñar e implementar una nueva funcionalidad completa en Magma.
---

# Workflow: Nueva Funcionalidad (/new-feature)

Este flujo de trabajo orquesta el ciclo de vida completo de un desarrollo, desde el descubrimiento hasta la implementación final, separando roles y responsabilidades.

## 📋 Fases del Ciclo de Vida

Toda feature debe pasar por estas 4 etapas secuenciales:

### 1. Descubrimiento y Concepto (Feature Architect)
- **Activación**: `/new-feature [DESCRIPCIÓN]`
- **Skill**: [`feature-architect`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/feature-architect/SKILL.md)
- **Objetivo**: Definir el "Qué" y el "Para qué" sin entrar en detalles técnicos.
- **Artefacto**: `concept_discovery.md`
- **Punto de Control**: El usuario debe aprobar el concepto funcional antes de seguir.

### 2. Diseño Técnico de Bajo Nivel (Tech Lead)
- **Activación**: Tras aprobación del `concept_discovery.md`.
- **Skill**: [`tech-lead`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/tech-lead/SKILL.md)
- **Objetivo**: Traducir requisitos a ficheros, esquemas y lógica.
- **Checklist de Resiliencia**: Es obligatorio definir el plan de fallo ("¿Qué pasa si falla la red?") y el diseño de los rollbacks necesarios para integraciones externas.
- **Artefacto**: `technical_design.md`
- **Punto de Control**: El usuario debe aprobar el diseño técnico antes de picar código.

### 3. Implementación Backend (Software Engineer)
- **Activación**: Tras aprobación del `technical_design.md`.
- **Skills**: [`endpoint-developer`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/endpoint-developer/SKILL.md), [`facade-developer`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/facade-developer/SKILL.md), [`service-developer`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/service-developer/SKILL.md).
- **Objetivo**: Crear toda la lógica de negocio, persistencia y API testeada. Debe integrar el **Patrón de Compensación** ante fallos de persistencia local post-API.

### 4. Implementación Frontend (Frontend Engineer)
- **Activación**: Tras finalizar el Backend.
- **Skill**: [`frontend-developer`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/frontend-developer/SKILL.md)
- **Objetivo**: Crear la interfaz UI/UX que consuma el backend implementado.

---

## 🚀 Uso del Comando

```text
/new-feature "Integrar sistema de facturación con Nexudus API"
```

El asistente activará automáticamente el rol de **Arquitecto de Features** para comenzar la fase 1.
