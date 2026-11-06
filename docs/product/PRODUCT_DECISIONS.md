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
| 2026-10-29 | Monthly Report UX | Period Accordion Cards | Agrupación visual en tarjetas verticales desplegables por mes. Permite auditar y controlar el estado contable de múltiples períodos sin mezclar consumos en una lista plana. |
| 2026-10-29 | User Lifecycle / Billing | Ignored / Silent Orphan Policy | Los usuarios sin Nexudus se ocultan por defecto en reportes. Posibilidad de marcar cuentas como 'Ignoradas' (staff, mantenimiento) para que nunca generen avisos ni aparezcan en el flujo de cobro. |
| 2026-10-29 | Billing Flexibility | Partial Copy Sync Support | En el reporte mensual se desglosan Copias Vinculadas vs Pendientes. Se autoriza la sincronización parcial a Nexudus de consumos asignados sin bloquear el flujo por copias pendientes de reparto. |
| 2026-11-02 | Automation Diagnostics | Master-Detail Split Screen | Extracción del historial de ejecuciones de Ajustes a un Centro de Diagnóstico propio para Administradores. Patrón de 2 columnas (lista cronológica + inspección profunda), filtrado por ciclo contable y segregación de usuarios con error/cambio vs inactivos para eliminar ruido visual. |
| 2026-11-02 | Granular Audit / Master History | Inline Nested Ledger & Screen Absorption | Absorber el Historial Maestro dentro del Reporte Mensual mediante filas expandibles por usuario y período. Eliminar la pantalla plana del Historial Maestro para simplificar la navegación y centralizar la auditoría contextual en el cierre mensual. |
| 2026-11-02 | User Lifecycle | Holistic Ignored User Management (Enfoque B) | Habilitar la edición bidireccional del estado 'Ignorado' en el editor de usuario con toggle contextual. Incorporar badges semánticos de estado (Facturable vs Ignorado) y filtros de auditoría en la lista principal de usuarios. |
| 2026-11-02 | Admin Navigation | Direct Landing on Monthly Report (Camino A) | Retirada de la pantalla de 'Inicio' para el rol Administrador para eliminar pantallas de vanidad pasivas. Los administradores aterrizan directamente en el 'Reporte Mensual' al autenticarse, optimizando el tiempo hacia la acción operativa. Los clientes mantienen su vista personal de consumos. |
| 2026-11-02 | Synced Copies / Rollback Policy | Inline Rollback & Time-Bound Reversion (Visión A) | Supresión de la pantalla plana 'Copias Vinculadas' del menú. Integración de la auditoría de ventas y acción de reversión (rollback) directamente en el detalle de usuario del Reporte Mensual. Blindaje temporal: la reversión solo está permitida mientras el período contable esté vigente (no caducado). |
| 2026-11-03 | Monthly Report UX / Taxonomy | Consumable Publication Taxonomy (Visión A: Flujo Operativo Puro) | Sustitución de términos ambiguos por una taxonomía rigurosa y transparente: 'Copias publicadas' (refleja exclusiva y estrictamente las copias con ventas ya confirmadas y transmitidas a Nexudus), 'Copias pendientes' (remanente real pendiente de sincronizar: Totales - Publicadas) y 'Copias totales' (volumen capturado del período). Se desvinculan las columnas principales del reparto contable multi-cuenta, eliminando falsos positivos donde consumos no facturados aparecían como publicados. |
| 2026-11-03 | Multi-Account Allocation | In-situ Allocation Ledger & Over-Allocation Safety Freeze | Rediseño de la herramienta de reparto para usuarios con múltiples cuentas Nexudus. Se sustituye la matriz rígida por una bitácora de entradas ('Allocation Ledger') donde el usuario o admin registra partidas hacia cuentas secundarias en cualquier momento del mes (con cantidad y motivo), mientras la cuenta principal absorbe el remanente. Protocolo de seguridad: si al cierre contable la suma declarada supera las copias reales de la impresora, el usuario se congela (no se publica en Nexudus), se muestra un indicador de sobreasignación en el reporte mensual y se despacha una alerta por correo al Administrador. |
| 2026-11-03 | Customer Dashboard Redesign | Personal Multi-Account Hub & Historical Cycle Drill-down (Visión A) | Rediseño integral de la experiencia del coworker no administrador. Flujo continuo en una sola pantalla: en la parte superior se sitúa el ciclo actual con la herramienta de 'Reparto de copias' integrada (exclusiva para multicuenta, permitiendo desviar copias in-situ solo para el período en curso). En la parte inferior, una tabla cronológica de ciclos cerrados anteriores con filas clickeables tipo acordeón que despliegan el desglose de copias facturadas por cada cuenta vinculada. Para usuarios monocuenta, se mantiene una vista limpia sin herramientas de reparto. |
| 2026-11-04 | User Impersonation | Admin Shadow Mode with Sidebar Selector (Visión A) | Implementación del modo 'Ver como usuario' (Shadow Mode). Acceso ubicado en el pie del menú lateral sobre el banner de usuario, mediante un modal de altura fija con lista scrollable y buscador instantáneo. La experiencia adopta la Visión A (takeover completo con banner flotante superior de aviso en tono ámbar y salida en 1 clic). Permite al Administrador operar activamente en nombre del cliente (asistencia de reparto, auditoría y resolución de incidencias sin requerir contraseñas). |
| 2026-11-04 | User Impersonation UX | High-Contrast Safety Banner (Visión A: Alerta Sólida) | Sustitución del banner translúcido de Modo Sombra por un bloque sólido de alta luminosidad (fondo ámbar cálido opaco con tipografía en negro carbón profundo). Garantiza contraste WCAG AAA e inequívoca visibilidad de seguridad sin interferencias visuales con la interfaz, con píldora de estado y botón de retorno en bloque oscuro contrastado. |
| 2026-11-06 | Monthly Report / Historical Billing | Extemporaneous Isolated Billing for Closed Periods (Visión B Refinada) | Las copias pendientes en períodos contables cerrados no se agregan a otros ciclos. Se habilita una regularización extemporánea aislada que genera cargos independientes vinculados unívocamente al mes cerrado de origen. El contexto de datos de cada mes en el reporte mensual queda estrictamente aislado, erradicando la mezcla de lecturas entre el ciclo cerrado y el activo. |
| 2026-11-06 | Rollback Policy / Living Cycle | Unified Operational Rollback Window (Visión A) | El criterio para permitir deshacer sincronizaciones (rollbacks) se basa en el momento de ejecución dentro del mes natural activo. Cualquier venta emitida en el mes en curso (consumos ordinarios o regularizaciones extemporáneas) puede anularse libremente mientras el mes actual no finalice. A fin de mes, todo queda sellado e inmutable. |
| 2026-11-06 | Monthly Report UX / User Filter | Cross-Period User Search & Smart Accordion Focus (Visión A) | Incorporación de un buscador transversal por usuario en la cabecera del Reporte Mensual. Filtra reactivamente las filas de todos los períodos y auto-despliega de forma inteligente los ciclos donde el coworker tiene actividad o saldos pendientes, atenuando los períodos inactivos para ofrecer una auditoría histórica 360° sin fricción. |

### 3. Reporte Mensual: La Pre-Auditoría (Drafting) y Cierre Periódico
El reporte mensual evoluciona de una vista estática a un **Centro de Cierre y Planificación Contable**:
- **Estructura de Tarjetas Verticales Desplegables**: Cada período/mes se presenta en una tarjeta colapsable independiente con métricas de salud (Copias Facturadas, Copias Pendientes, Estado del Mes).
- **Higienización del Flujo (Cero Falsas Alarmas)**: Los usuarios de impresora sin vincular a Nexudus quedan ocultos por defecto del reporte mensual. Se habilita un estado "Ignorado" para cuentas que nunca deben facturarse (mantenimiento, personal interno).
- **Desglose Binario por Usuario (Vinculadas vs Pendientes)**: Cada coworker muestra de un vistazo sus copias con destino asignado vs copias pendientes de asignación.
- **Sincronización Parcial Permitida**: El administrador puede empujar a Nexudus las copias vinculadas y listas, sin que las copias pendientes de reparto bloqueen el cobro del período.
- **Inline Distribution Editor**: Panel expandible para repartir manualmente las copias entre cuentas nexudus vinculadas.
- **Balance Check 1:1**: Indicador visual dinámico que valida que la suma de copias asignadas coincide exactamente con el total capturado de la impresora.
- **Remainder Auto-Fill**: Botón inteligente para asignar todo el remanente a la cuenta por defecto en un solo clic.
- **Auditoría Granular Integrada (Inline Nested Ledger)**: Cada coworker dispone de un desplegable contextual que muestra las capturas individuales de la impresora realizadas dentro del ciclo (fecha/hora, desglose A4/A3 Color/BN y delta sumado).
- **Consolidación de Arquitectura de Vistas (Cero Duplicidades)**: La pantalla aislada de 'Historial Maestro' se retira del menú de navegación. Toda auditoría de lecturas se unifica dentro del contexto mensual donde aporta valor operativo directo.

### 4. Centro de Diagnóstico de Automatismos (Master-Detail)
Extracción de la auditoría de automatismos de la pantalla de Ajustes hacia un espacio exclusivo de observabilidad para el Administrador:
- **Layout en Dos Columnas (Master-Detail)**: Columna izquierda estrecha con el listado cronológico de ejecuciones (recientes primero con indicador semántico de resultado); columna derecha ancha con la inspección profunda del evento seleccionado.
- **Barra de Filtros Multifactorial**: Selector de ciclo de facturación (período contable), filtro por estado (Todos, Solo Fallidos, Exitosos) y por tipo de proceso (Sincronización de Impresora vs Facturación en Nexudus).
- **Aislamiento del Ruido (Signal over Noise)**: En cada evento, los usuarios con incidencias o cambios de consumo se priorizan en bloques visibles destacados; los usuarios inactivos o sin cambios se agrupan en una sección colapsada.
- **Preservación Integral de la Traza**: Registro técnico accesible en un visor monoespaciado sin recortes y con acción de un clic para copiar al portapapeles.

### 5. Gestión Integral de Cuentas Ignoradas (Ciclo de Vida de Usuario)
Control bidireccional y visibilidad panorámica para excluir o reincorporar cuentas en los procesos de facturación automática:
- **Control Semántico en Editor**: Selector interactivo tipo interruptor dentro del formulario de usuario con micro-copy contextual que aclara el alcance de la exclusión (se omiten de reportes y de Nexudus sin perder la traza técnica física).
- **Visibilidad en Lista y Tabla (Badges)**: Distinción visual clara entre cuentas facturables y cuentas ignoradas (personal de limpieza, soporte de impresoras, mantenimiento).
- **Filtro Rápido de Auditoría**: Píldoras o selector en la cabecera de la lista de usuarios para filtrar rápidamente entre *Todos*, *Facturables* o *Ignorados*.

### 6. Simplificación Radical de Navegación (Entrada Directa a Reporte Mensual)
Eliminación de la pantalla pasiva de Inicio para el Administrador en favor de un flujo centrado en la acción inmediata:
- **Cero Grasa Cognitiva**: Se suprime la pantalla de Inicio genérica para el Administrador. Al autenticarse o entrar a la aplicación, aterriza directamente en el **Reporte Mensual** con el período activo en curso.
- **Navegación Enfocada**: La barra lateral para el Administrador se compacta en los 4 módulos esenciales: *Reporte Mensual*, *Centro de Automatismos*, *Usuarios* y *Ajustes*.
- **Preservación del Espacio del Cliente**: Los usuarios con rol de cliente mantienen su experiencia personal (*Mis Consumos*), accediendo a su propio desglose de copias y previsión de factura sin verse afectados.

### 7. Auditoría de Ventas Contextual y Reversión Temporalmente Acotada
Unificación del ciclo de vida contable dentro del Reporte Mensual y blindaje de la integridad histórica:
- **Supresión de la Pantalla Aislada**: Se elimina la ruta y el acceso de "Copias Vinculadas" del menú lateral.
- **Acción 'Deshacer Sincronización' Integrada en Detalle de Usuario**: Dentro del modal o drawer de detalle de copias de cada coworker en un período específico, se visualizan las ventas generadas y se permite disparar la reversión (devolviendo el consumo a estado pendiente y anulando la venta en la pasarela externa).
- **Regla de Cierre Temporal Inmutable (Ventana Operativa hasta Fin de Mes Natural)**:
  - **Dinámica Operativa**: El corte de lectura de copias del ciclo finaliza un par de días antes del cierre de mes, pero la **facturación real y efectiva se ejecuta el último día del mes**.
  - **Ventana de Gracia**: La posibilidad de rectificar y deshacer una sincronización permanece activa durante todo el mes natural correspondiente al ciclo (hasta el último segundo del último día de ese mes).
  - **Bloqueo Definitivo**: Llegado el primer día del mes siguiente (ej. 1 de diciembre para el ciclo de noviembre), la facturación ya es un hecho consumado e irrevocable en el sistema contable. A partir de ese momento, la opción de «Deshacer sincronización» queda terminantemente bloqueada en Magma para impedir descuadres fiscales y dobles facturaciones.

### 8. Bitácora de Asignación Multi-cuenta (Allocation Ledger) y Blindaje por Sobreasignación
Rediseño integral de la experiencia de distribución para coworkers con múltiples cuentas en Nexudus:
- **Exclusividad para Perfiles Multi-cuenta**: El botón y las herramientas de reparto se ocultan por completo para usuarios con una sola cuenta vinculada, garantizando cero ruido operativo.
- **Modelo de Bitácora In-situ (Allocation Ledger)**: Los coworkers pueden añadir entradas de asignación puntuales hacia cuentas secundarias en cualquier momento del mes (indicando cuenta destino, cantidad de copias y motivo/concepto del trabajo), sin depender de una foto fija o del cierre contable.
- **Absorción Pasiva en Cuenta Principal**: La cuenta principal jamás se edita a mano; absorbe automáticamente la diferencia entre el total real de la impresora y la suma de las partidas asignadas.
- **Blindaje por Sobreasignación (Over-Allocation Freeze)**:
  - Si al momento del cierre mensual la suma de las partidas registradas por el usuario supera el volumen físico detectado en la impresora, **se congela la publicación hacia Nexudus de ese usuario específico** (sin bloquear la facturación de los demás miembros).
  - Se despacha de forma proactiva una **alerta por correo electrónico al Administrador** detallando el descuadre (usuario, copias declaradas vs copias reales).
  - En la tabla del Reporte Mensual se muestra una píldora o badge distintivo de atención contable (*Sobreasignado / Bloqueado*) para facilitar la intervención manual o solicitar al usuario la corrección de sus registros.

### 9. Espacio Personal del Coworker: Gestión Activa de Ciclo y Auditoría Histórica Desplegable (Visión A)
Rediseño de la pantalla de inicio del cliente no administrador estructurado en un flujo continuo y jerárquico:
- **Jerarquía Temporal (Presente Vivo vs Pasado Inmutable)**:
  - **Zona Superior (Ciclo en Curso)**: Tarjeta resumen del consumo del mes activo. Para coworkers con múltiples cuentas Nexudus vinculadas, se integra directamente el panel de **Reparto de copias** para registrar partidas hacia cuentas secundarias en tiempo real y observar el remanente en la principal. Para usuarios monocuenta, se muestra una tarjeta limpia sin herramientas de reparto, manteniendo una experiencia libre de ruido.
  - **Zona Inferior (Historial de Cierres Anteriores)**: Tabla cronológica de ciclos anteriores cerrados. Cada fila resume el período, volumen total de copias y estado del cierre.
- **Interacción Drill-down en Cierres Históricos**:
  - Al hacer clic sobre cualquier ciclo anterior en la tabla, la fila se despliega como un acordeón mostrando el desglose auditado de copias facturadas a cada cuenta vinculada (nombre de la cuenta, cantidad de copias imputadas y motivo registrado).
  - **Inmutabilidad Fiscal**: Los ciclos históricos son estrictamente de solo lectura, transmitiendo solidez y tranquilidad financiera al coworker.

### 10. Modo Sombra de Administrador (User Impersonation / Shadow Mode)
Herramienta de asistencia remota y auditoría operativa que permite al Administrador visualizar y operar la aplicación exactamente como un coworker específico:
- **Punto de Entrada en Barra Lateral**:
  - Ubicado en la parte inferior del menú lateral de administración, directamente sobre el bloque de perfil del usuario.
  - Botón distinguido con icono de máscara/ojo y texto claro (*"Ver como usuario"*).
- **Selector de Usuario (Modal de Exploración Ágil)**:
  - Ventana modal de dimensiones fijas con lista scrollable optimizada.
  - Buscador en tiempo real en la parte superior que filtra instantáneamente por nombre o identificador.
  - Cada elemento de la lista muestra el avatar/icono, nombre del usuario, rol y cantidad de cuentas asociadas para facilitar la selección.
- **Experiencia Inmersiva (Visión A: Takeover Completo)**:
  - Al seleccionar un usuario, la aplicación transiciona al espacio personal del cliente (**"Mi Consumo"**).
  - El menú de navegación se ajusta al contexto del cliente, permitiendo experimentar la herramienta con los mismos límites y visuales del usuario final.
- **Barra de Alerta Flotante Superior (Safety Banner)**:
  - Franja horizontal fija en la parte superior de la pantalla en tonos ámbar/aviso de alto contraste.
  - Texto informativo visible en todo momento: *"Estás viendo la aplicación como **[Nombre del Coworker]** (Modo Soporte)"*.
  - Botón de escape permanente: **`[Salir y Volver a Administrador]`**, que con un solo clic finaliza la suplantación y restaura la sesión del Administrador en su panel de control original.
- **Capacidad Operativa Activa**:
  - El Administrador puede tanto consultar datos como interactuar en nombre del cliente (por ejemplo, registrar o ajustar partidas de reparto de copias del ciclo activo si el usuario requiere asistencia).
- **Seguridad Unidireccional**:
  - Esta funcionalidad es un privilegio exclusivo y estricto del rol Administrador; los clientes no tienen constancia ni acceso a herramientas de cambio de perspectiva.

### 11. Liquidación Aislada y Regularización Extemporánea de Períodos Cerrados (Visión B Refinada)
Tratamiento riguroso de consumos pendientes en ciclos históricos sin contaminar los períodos activos ni alterar la contabilidad consolidada:
- **Aislamiento Estricto de Contexto Temporal**: Cada tarjeta mensual en el Reporte Mensual opera de forma hermética sobre los datos de su propio período. Queda totalmente descartada la visualización o procesamiento cruzado de lecturas del ciclo actual cuando se consulta o actúa sobre un mes cerrado.
- **Facturación Extemporánea Independiente (Cero Agregación a Otros Ciclos)**:
  - Las copias no publicadas de un período cerrado no se refundan ni se suman a los totales de ningún otro ciclo contable.
  - Al ejecutar la regularización de un usuario en un período cerrado, se genera una transacción y factura **completamente independiente y aislada**, imputada con la etiqueta y concepto exclusivo del mes de origen (ej: *"Regularización de consumo - [Mes Año]"*).
- **Transparencia y Trazabilidad 1:1**:
  - El ciclo activo en curso mantiene su balance transparente, reflejando exclusivamente los consumos de su propia ventana mensual.
  - El coworker recibe un cargo nítido y segregado que explica exactamente a qué período histórico pertenecía ese remanente, facilitando la comprensión y evitando reclamos por variaciones inesperadas en la facturación ordinaria.

### 12. Ventana de Rectificación Operativa Unificada en Ciclo Activo (Visión A)
Flexibilidad y tolerancia a errores durante la operativa mensual sin comprometer la inmutabilidad de los cierres consolidados:
- **Criterio Basado en el Momento de Ejecución**:
  - La ventana de gracia para deshacer una sincronización y anular la venta en la pasarela externa se rige por el **mes natural en el que se ejecuta la acción**, no por el período de origen de las copias.
  - Tanto los consumos ordinarios del ciclo activo como las regularizaciones extemporáneas de períodos anteriores ejecutadas durante el mes corriente disponen de la acción **`[Deshacer]`** activa en la bitácora de sincronización del coworker.
- **Efecto de la Reversión**:
  - La venta se elimina automáticamente de la pasarela externa (Nexudus).
  - Las copias asociadas vuelven de inmediato al estado *"Pendientes"* en su respectivo período (sea el mes en curso o el mes cerrado regularizado).
  - Los balances y reportes se recalculan en tiempo real.
- **Sello Definitivo a Fin de Mes**:
  - Al concluir el último día del mes natural en curso (23:59:59), todas las transacciones ejecutadas en ese mes quedan selladas con candado y su reversión queda terminantemente bloqueada en Magma.

### 13. Búsqueda Transversal de Usuario y Enfoque Inteligente de Períodos (Visión A)
Capacidad de auditoría y localización inmediata del historial de cualquier coworker a través de todos los ciclos contables dentro del Reporte Mensual:
- **Buscador Reactivo Integrado en Cabecera**:
  - Campo de búsqueda accesible y prominente en la barra de herramientas del Reporte Mensual con soporte para nombre o identificador de usuario y botón instantáneo de borrado (`[×]`).
  - Filtrado en cascada en tiempo real: al escribir, todas las tablas de usuarios de los períodos cargados se sincronizan para mostrar únicamente al coworker seleccionado.
- **Comportamiento Inteligente de Acordeones (Smart Accordion Focus)**:
  - **Auto-Enfoque Activo**: Aquellos períodos mensuales donde el usuario consultado cuenta con consumos registrados, copias pendientes o regularizaciones se expanden de forma automática o reciben un indicador visual destacado para facilitar la inspección inmediata.
  - **Minimización de Ruido**: Los ciclos contables donde el usuario no registra actividad ni copias se mantienen colapsados y adoptan un estado atenuado con indicación de *"Sin actividad en este ciclo"*, evitando el escaneo de tablas vacías.
- **Preservación Integral de la Operativa por Ciclo**:
  - La búsqueda no altera las acciones operativas existentes: el Administrador puede consultar las lecturas desglosadas de la impresora, ejecutar regularizaciones aisladas en meses cerrados o gestionar el reparto en el mes activo directamente desde la fila del usuario filtrado.
  - Se mantiene íntegro el principio de aislamiento contable por período (Decisión #11), sin consolidaciones fiscales cruzadas entre meses.

## Decisiones Estéticas (UX Premium)

---

## 🛠️ Guía de Uso del Log

1. **Consulta Obligatoria**: Antes de proponer una nueva feature, el `product-designer` debe validar que la idea no contradice la **Visión** o los **Pilares**.
2. **Registro Post-Brainstorming**: Cada sesión finalizada con `/product-design` debe terminar con una entrada en este log si se ha tomado una decisión que afecte al ADN de Magma.
