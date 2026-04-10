# Product Decisions Log: Magma

Este documento es la **Memoria Central de Producto** de Magma. Registra la visión estratégica, los pilares de negocio y las decisiones que mantienen la coherencia evolutiva del sistema.

---

Magma nace para eliminar la fricción operativa en la gestión de costes de impresión de un espacio de coworking. Su propósito es actuar como un **puente inteligente** entre la infraestructura física (impresoras) y la gestión financiera (Nexudus), transformando datos brutos en facturacion automatizada y transparente.

### Propuesta de Valor

- **Para el Administrador**: Reducción drástica del tiempo dedicado a la auditoría manual de copias y facturación.
- **Para el Cliente**: Confianza total mediante una facturación justa, basada en datos reales y visibles.

---

## 💎 Pilares Estratégicos

1. **Automatización Invisible**: El sistema debe trabajar "por detrás". La sincronización y la facturación son procesos desatendidos que solo requieren atención ante anomalías.
2. **La Impresora como Fuente de Verdad**: Magma no inventa usuarios ni consumos; refleja la realidad de la infraestructura física. Si un usuario existe en la impresora, Magma lo reconoce.
3. **Sincronía con el Ecosistema**: Integración nativa con Nexudus como estándar de facto para la gestión de coworkings, evitando duplicidad de tareas administrativas.
4. **Transparencia Operativa**: Cada euro facturado debe tener una traza clara de consumo (A4/A3, Color/BN, con/sin papel).

---

## 👤 User Personas

### El Administrador (The Orchestrator)

- **Motivación**: Eficiencia y "hacer más con menos".
- **Dolor**: El cierre de mes y el cuadre manual de hojas de Excel con reportes de impresora.
- **Necesidad en Magma**: Un Dashboard que diga "Todo está bajo control" o "Aquí hay un problema que requiere tu atención".

### El Cliente (The Consumer)

- **Motivación**: Pagar solo por lo que usa.
- **Dolor**: Facturas sorpresa o falta de detalle en sus consumos de impresión.
- **Necesidad en Magma**: Reportes claros y una transición fluida hacia su factura en Nexudus.

---

## 🧠 Historial de Decisiones Estratégicas

| Fecha | Feature / Iniciativa | Decisión Estratégica | Racional & Contexto |
| :--- | :--- | :--- | :--- |
| 2026-03-24 | Core Architecture | Enforce Facade Pattern | Garantizar desacoplamiento entre API y Servicios para facilitar testing y escalabilidad operativa de producto. |
| 2026-04-01 | Admin Role | Single Admin Only | Magma está diseñado para operativa interna centralizada. Un solo admin garantiza simplicidad y seguridad total. |
| 2026-04-05 | Automation | Proactive Sync Alerts | Priorizar la visibilidad inmediata de fallos en sincronización para evitar descuadres en el cierre de mes del coworking. |
| 2026-04-05 | User Lifecycle | No Manual Creation | Los usuarios nacen en la impresora. Magma los descubre y gestiona, evitando la desincronía manual entre sistemas. |
| 2026-04-05 | User Identity | Optional Nexudus ID | Desbloquear la creación automática permitiendo usuarios sin Nexudus. El linkeo se vuelve un proceso de enriquecimiento posterior, no un requisito de existencia. |
| 2026-04-06 | Billing | Delegated Pricing/Billing | Magma deja de gestionar precios y facturas. Se convierte en un "Consumable Proxy" que registra ventas de productos en Nexudus mensualmente. |
| 2026-04-06 | Security | Dynamic Nexudus Auth | Sustitución de token estático por login temporal (user/pass) para interactuar con la API de Nexudus de forma más segura. |
| 2026-04-06 | UX | Units Over Euros | El Dashboard del cliente priorizará unidades (copias) sobre euros, eliminando la fricción de desincronía de precios entre sistemas. |
| 2026-04-05 | Customer Dashboard | Evolución vs Estado Actual | Reemplazar gráfica de anillas (foco en proporciones) por gráfica de barras mes a mes. Esto aporta más valor visual al cliente al ver su evolución de gasto (YTD). |
| 2026-04-08 | Admin Billing | Audit-First Sales History | Implementar una vista maestra de auditoría (Enfoque B) para el administrador, facilitando la supervisión global de las ventas sincronizadas con Nexudus frente al detalle individual por usuario. |
| 2026-04-08 | Billing Sync | Automated Rollback Policy | La eliminación de una venta en Magma debe disparar obligatoriamente el borrado en Nexudus (vía API). Las copias vinculadas deben volver al estado "pendiente" para garantizar la consistencia y evitar duplicidad en re-sincronizaciones. |
| 2026-04-08 | UX / User Identity | Interactive User Linking | Transformar el estado "Pendiente de Nexudus" de un indicador pasivo a una acción directa (botón -> modal). Esto refuerza el rol de Magma como puente manual guiado cuando la automatización no es posible. |
| 2026-04-09 | Multi-account Sync UX | Expandable Row Drill-down | Para evitar la fatiga visual en usuarios con múltiples cuentas, se adopta un modelo de "Resumen + Expansión". Esto mantiene la tabla limpia para el 90% de los usuarios mientras aporta detalle total para casos complejos. |
| 2026-04-09 | Pre-Billing Allocation | Draft Distribution (Report) | Permitir al administrador pre-asignar consumos a diferentes cuentas *antes* de la sincronización. Esto desplaza la complejidad del post-cobro a una fase de planificación controlada, asegurando que la suma de copias sea correcta visualmente mediante indicadores de balance. |

### 3. Reporte Mensual: La Pre-Auditoría (Drafting)
El reporte mensual evoluciona de una vista estática a una herramienta de **Planificación de Cobro**:
- **Inline Distribution Editor**: Panel expandible para repartir manualmente las copias entre cuentas nexudus vinculadas.
- **Balance Check 1:1**: Indicador visual dinámico que valida que la suma de copias asignadas coincide exactamente con el total capturado de la impresora. No se permite la sincronización si el balance no es verde.
- **Remainder Auto-Fill**: Botón inteligente para asignar todo el remanente a la cuenta por defecto en un solo clic.

## Decisiones Estéticas (UX Premium)

---

## 🛠️ Guía de Uso del Log

1. **Consulta Obligatoria**: Antes de proponer una nueva feature, el `product-designer` debe validar que la idea no contradice la **Visión** o los **Pilares**.
2. **Registro Post-Brainstorming**: Cada sesión finalizada con `/product-design` debe terminar con una entrada en este log si se ha tomado una decisión que afecte al ADN de Magma.
