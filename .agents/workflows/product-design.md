---
description: Comando para brainstorming y diseño estratégico de alto nivel para Magma. Enfoque 100% en producto y UX.
---

# Workflow: Diseño de Producto (/product-design)

Este flujo de trabajo permite al usuario iterar sobre ideas abstractas, definir la visión de negocio y asegurar que las nuevas funcionalidades encajen en el ecosistema Magma sin entrar en detalles técnicos.

## 📋 Fases de la Sesión de Brainstorming

### 1. Inmersión en Memoria y Contexto
- **Activación**: `/product-design [IDEA/CONCEPTO]`
- **Skill**: [`product-designer`](file:///Users/ote/IdeaProjects/Magma/.agents/skills/product-designer/SKILL.md)
- **Acción**: Leer obligatoriamente [`PRODUCT_DECISIONS.md`](file:///Users/ote/IdeaProjects/Magma/docs/product/PRODUCT_DECISIONS.md).
- **Objetivo**: Detectar conflictos estratégicos y alinear con la visión general.

### 2. Exploración de Escenarios (Divergencia)
- El agente propondrá al menos **dos enfoques estratégicos** distintos para la idea recibida.
- Se fomentará el debate mediante preguntas abiertas ("¿Cómo afectaría esto a...?").

### 3. Prototipado Conceptual Visual
- Si el concepto es complejo (ej: un nuevo Dashboard), el agente generará **imágenes conceptuales** para alinear la visión visual.

### 4. Definición del Happy Path
- Se documentará el flujo ideal del usuario (Step-by-step) para validar la usabilidad.

### 5. Consolidación de Decisión y Cierre
- **Artefacto**: Generar/Actualizar `docs/product/PRODUCT_DESIGN_CURRENT.md` con las conclusiones.
- **Memoria**: Actualizar el Log de decisiones en `PRODUCT_DECISIONS.md`.

---

## 🚀 Uso del Comando

```text
/product-design "Sistema de reservas para la terraza del coworking"
```

El asistente activará automáticamente al **Product Designer** para una sesión de brainstorming estratégico.
