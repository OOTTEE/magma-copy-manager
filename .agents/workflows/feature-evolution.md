---
description: Comando para analizar y evolucionar una funcionalidad o proceso existente, integrando diagnóstico de bugs y rediseño multi-capa.
---

# Workflow: Evolución de Feature (/feature-evolution)

Este flujo de trabajo se activa cuando una funcionalidad requiere mejoras de rendimiento, corrección de comportamientos inesperados o una evolución en su diseño técnico/visual.

## 📋 Fases del Proceso de Mejora

### 1. Auditoría de Estado Actual (Refactor Engineer / Bug Analyst)
- **Activación**: `/feature-evolution [DESCRIPCIÓN DEL PROCESO A MEJORAR]`
- **Skills**: [`refactor-engineer`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/refactor-engineer/SKILL.md), [`bug-analyst`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/bug-analyst/SKILL.md)
- **Objetivo**: Detectar "smells", cuellos de botella técnicos o bugs que afectan la feature.
- **Artefacto**: Generar `improvement_audit.md` con el diagnóstico.

### 2. Rediseño y Re-arquitectura (Tech Lead / UX Designer)
- **Skill**: [`tech-lead`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/tech-lead/SKILL.md), [`ux-designer`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/ux-designer/SKILL.md)
- **Objetivo**: Si la mejora requiere cambios en la base de datos o API, el `tech-lead` diseña la nueva estructura. Si afecta la interfaz, el `ux-designer` refina la estética premium.
- **Artefacto**: Actualizar `technical_design.md` o crear Mockups visuales.

### 3. Plan de Migración y Refactorización
- **Objetivo**: Definir cómo se pasará del estado "A" al "B" sin romper la compatibilidad actual.
- **Artefacto**: `implementation_plan.md` con enfoque en "Zero Downtime" o estabilidad.

---

## 🚀 Uso del Comando

```text
/feature-evolution "Optimizar el proceso de reconciliación de facturas Nexudus"
```

El asistente activará automáticamente al **Refactor Engineer** para una auditoría de código y lógica.
