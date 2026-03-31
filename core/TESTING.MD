# Estrategia de Testing - Magma

Este documento define las directrices y estándares para la creación de pruebas en el proyecto Magma, priorizando la mantenibilidad y la proximidad del código de validación.

## Ubicación y Nomenclatura

Para asegurar un ciclo de desarrollo ágil y reducir la complejidad en la navegación, el proyecto implementa la **co-ubicación** de tests dentro de directorios de módulo.

### Reglas de Ubicación

- **Proximidad Total:** Los tests deben residir en el mismo directorio que el módulo o clase que validan.
- **Estructura de Directorio:** Cada componente (servicio/endpoint) debe tener su propia carpeta.
- **Convención de Nombres:** Utilizar el sufijo `.test.ts`.
  - Ejemplo: `core/services/printer/scraper.service.ts` -> `core/services/printer/scraper.service.test.ts`.

---

## Estándares de Implementación

### Motor de Pruebas

Se utiliza **Vitest** con ejecución en entorno Node.js. Los métodos `describe`, `it`, `expect`, etc., están disponibles de forma global.

### Tipos de Pruebas

1. **Tests Unitarios:** Centrados en la lógica de negocio técnica (Services) de forma aislada.
2. **Tests de Integración:** Validan la interacción con la persistencia (Repositories) o servicios externos simulados.
3. **Tests de Endpoints:** Verificación de contratos API, códigos de estado HTTP y validación de esquemas (Routes).

### Reglas de Oro

- **Aislamiento:** Cada test debe ser atómico y no depender del estado de ejecuciones previas.
- **Limpieza:** Usar `beforeEach` o `afterEach` para resetear mocks o datos temporales en la DB de pruebas.
- **Mocks:** Utilizar `vi.mock()` para interceptar dependencias externas críticas (ej. Nexudus API) y garantizar tests deterministas.

---

## Estructura Visual Esperada

```text
src/
  services/
    pdf/
      service.ts
      service.test.ts         <-- Test unitario co-ubicado en su módulo
    printer/
      scraper.service.ts
      scraper.service.test.ts
  routes/
    api/
      users/
        index.ts
        index.test.ts         <-- Test de endpoint co-ubicado en su ruta
```

---

### Por qué funciona

Al aplicar **co-ubicación** y **estructuración por módulos**, se elimina la necesidad de mantener una jerarquía de carpetas paralela y se reduce drásticamente el ruido visual en las carpetas raíz de `services` o `routes`. Este enfoque asegura que el desarrollador tenga todo el contexto (código, tests, mocks) en un solo lugar, facilitando la detección de código no probado y acelerando la refactorización.
