# Product Design: Admin Dashboard (Orchestrator)

## Visión General
El nuevo Dashboard del Administrador se redefine como el **Cerebro Operativo** de Magma. Deja de ser una pantalla de bienvenida estática para convertirse en un centro de ejecución y monitoreo proactivo.

## Componentes Clave

### 1. Centro de Acción (Manual Overrides)
Se introducen dos disparadores críticos para mitigar los fallos de automatización:
- **Sincronización de Copias**: Botón de alta prioridad para forzar el scrap de la impresora.
- **Procesamiento de Cobros**: Botón de cierre de ciclo para empujar todos los registros pendientes a Nexudus.

### 2. Capa Analítica (Health Pulse)
- **Histórico de Volumen**: Gráfica de líneas que muestra la evolución mensual de copias. Permite al administrador detectar anomalías de consumo a simple vista.
- **KPIs Dinámicos**: Tarjetas de estado con el número de copias pendientes de cobro y usuarios sin vincular.

### 3. Log de Actividad (Transparencia)
- Un feed vertical con los últimos eventos del sistema. Aporta feedback inmediato sobre el éxito o fracaso de las tareas en segundo plano.

## Decisiones Estéticas (UX Premium)
- **Glassmorphism**: Uso de transparencias y difuminado (backdrop-blur) para mantener la jerarquía visual sobre el fondo oscuro.
- **Micro-animaciones**: Feedback visual en los botones durante los procesos de red para evitar la sensación de bloqueo.
- **Accordion Drill-down**: Implementación de filas expandibles en tablas de alta densidad de datos para permitir el desglose sin perder el contexto global.

## Evolución de Auditoría Sync (Multi-cuenta)
Para resolver la complejidad de las copias repartidas en varias cuentas, se rediseña la tabla de auditoría:
1. **Fila Colapsada**: Resumen de usuario, mes y volumen total (Páginas totales). Indicador visual de "N-Cuentas".
2. **Fila Expandida (The Breakdown)**: Se despliega un panel con **Cards de Cuenta**. Cada card utiliza el `NexudusAccountBadge` y muestra los links de Nexudus y conceptos facturados *exclusivamente* para esa cuenta.

## Reporte Mensual: La Pre-Auditoría (Drafting)
El reporte mensual evoluciona de una vista estática a una herramienta de **Planificación de Cobro**:
- **Inline Distribution Editor**: Panel expandible en cada fila para repartir manualmente las copias entre cuentas nexudus vinculadas *antes* de la sincronización.
- **Balance Check 1:1**: Indicador visual dinámico que valida que la suma de copias asignadas coincide exactamente con el total capturado de la impresora. No se permite la sincronización si el balance no es verde (Checked).
- **Edit & Assign UI**: Controles granulares (+/-) para asignar copias remanentes a cuentas existentes o cuentas vinculadas secundarias.
- **Remainder Auto-Fill**: Botón inteligente para asignar todo el remanente a la cuenta por defecto en un solo clic.

---

## 🛠️ Guía de Uso del Log

1. **Consulta Obligatoria**: Antes de proponer una nueva feature, el `product-designer` debe validar que la idea no contradice la **Visión** o los **Pilares**.
2. **Registro Post-Brainstorming**: Cada sesión finalizada con `/product-design` debe terminar con una entrada en este log si se ha tomado una decisión que afecte al ADN de Magma.

---
*Diseño validado el 2026-04-09*
