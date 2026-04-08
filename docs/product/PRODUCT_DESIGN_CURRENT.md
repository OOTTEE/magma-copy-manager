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

---
*Diseño validado el 2026-04-08*
