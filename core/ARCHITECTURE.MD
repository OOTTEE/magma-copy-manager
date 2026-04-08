# Arquitectura del Proyecto - Magma

Este documento define la estructura de capas de la aplicación Magma, estableciendo responsabilidades claras y reglas de interacción para asegurar un diseño desacoplado y mantenible.

## Jerarquía de Capas y Responsabilidades

| Capa | Responsabilidad | Dependencias permitidas |
| :--- | :--- | :--- |
| **API (Routes)** | Interfaz externa, gestión de HTTP y validación de entrada. | Facade, Domain |
| **Facade** | Orquestación de servicios, lógica de negocio multi-dominio y control de acceso a recursos. | Service, Domain |
| **Service** | Lógica de negocio core e integraciones externas. | Repository, Domain |
| **Repository** | Abstracción de persistencia y comunicación con base de datos. | Domain |
| **Domain** | Definición de modelos, entidades y tipos fundamentales. | Ninguna |

---

## Estructura de Directorios (Modulo-per-Folder)

Para reducir el ruido visual y facilitar la co-ubicación de tests, cada componente importante (Servicio o Endpoint) debe tener su propio directorio.

### Reglas de Estructura

- **Encapsulamiento:** Cada servicio o recurso de API debe residir en un directorio con su nombre.
- **Punto de Entrada:** El fichero principal se ubica dentro de su carpeta (ej. `index.ts`, `user.service.ts`).
- **Co-ubicación de Ficheros:** Los tests, mocks y tipos locales viven en ese mismo directorio.

## 1. Capa de API - Routes

Punto de entrada de la aplicación encargado de la comunicación con el exterior.

### Reglas de Uso - API

- **Validación Estricta:** Implementar validación de esquemas para toda entrada (params, query, body).
- **Seguridad:** Aplicar middlewares de autenticación y control de acceso (RBAC).
- **Sin Lógica de Negocio:** Se limita a extraer datos de la petición (incluyendo el usuario autenticado), invocar a la **Fachada** correspondiente y retornar la respuesta formateada.
- **Gestión de Respuestas:** Mapear excepciones de negocio a códigos de estado HTTP estandarizados.

## 2. Capa de Facade

Actúa como orquestador de alto nivel y guardian de la visibilidad de los datos.

### Reglas de Uso - Facade

- **Orquestación de Negocio:** Coordina múltiples servicios para completar una funcionalidad compleja.
- **Control de Acceso a Recursos:** Verifica si el usuario (proporcionado por la capa API) tiene permiso para ver o modificar el recurso específico solicitado (ej. "Yo solo veo mis copias").
- **Aislamiento de BD:** NUNCA accede directamente a los repositorios. Siempre debe pasar a través de la capa de Service.
- **Independencia de Transporte:** Al igual que los servicios, no debe conocer objetos de Fastify (request/reply).

## 3. Capa de Service

Núcleo funcional donde se implementan los casos de uso y reglas de negocio.

### Reglas de Uso - Service

- **Independencia del Transporte:** No debe referenciar conceptos de HTTP ni objetos de librería de servidor (request/reply).
- **Orquestación:** Responsable de coordinar múltiples repositorios o integraciones externas para cumplir un proceso.
- **DTO (Data Transfer Objects):** Transformar entidades de persistencia en estructuras de datos optimizadas para la API.
- **Atomicidad:** Garantizar la integridad de las operaciones mediante la gestión de transacciones.
- **Compensación Inmediata (Manual Rollback):** En procesos que involucran APIs externas (donde no existe una transacción distribuida real), el servicio debe seguir un patrón de **"DB-Last"**. Primero se asegura el éxito en el sistema externo y, si la persistencia local posterior en SQLite falla, el servicio debe capturar la excepción y ejecutar proactivamente una orden de eliminación o reversión en el API externa. Esto evita que el sistema externo contenga datos que Magma no reconoce.
- **Transacciones SQLite (Drizzle):** Dado que se utiliza el driver `better-sqlite3`, las transacciones de base de datos (`db.transaction`) son estrictamente **síncronas**. El callback de la transacción NUNCA debe ser `async` ni retornar una `Promise`, ya que esto causaría errores fatales en el driver. Operaciones internas deben usar `.run()` o `.get()`.
- **Intercepción de Infraestructura:** Para depuración profunda de integraciones, se utiliza la inyección de un manejador `customFetch` en el cliente de API. Esto permite el logging detallado de peticiones y respuestas (incluyendo cuerpos en nivel `TRACE`) sin modificar el código autogenerado del cliente.

## 4. Capa de Repository

Encapsula el acceso a los datos, permitiendo que el resto de la aplicación sea agnóstica al motor de almacenamiento.

### Reglas de Uso - Repository

- **Abstracción:** Ocultar detalles de implementación de consultas y sintaxis del motor de datos.
- **Interacción Directa:** Es la única capa autorizada para realizar operaciones CRUD y consultas complejas.
- **Entidades de Dominio:** Debe retornar objetos balanceados que representen el estado en persistencia, sin lógica añadida.

## 5. Capa de Dominio

Define el lenguaje común (Ubiquitous Language) del sistema a través de modelos y contratos.

### Reglas de Uso - Dominio

- **Estabilidad:** Debe ser la capa más interna y estable, sin dependencias externas.
- **Definiciones:** Contiene los esquemas de tablas, interfaces de entidades y enumeraciones globales.

---

### Por qué funciona

Esta separación de intereses (SoC) facilita el cumplimiento de los principios **SOLID**. El uso de una estructura **Modulo-per-Folder** evita la saturación de los directorios raíz de cada capa, permitiendo que cada funcionalidad sea auto-contenida con sus propios tests y utilidades sin interferir visualmente con el resto del sistema.
