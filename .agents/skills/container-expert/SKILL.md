---
name: container-expert
description: Experto en Docker y arquitectura de contenedores para Magma. Garantiza la seguridad, el aislamiento de datos y la configuración por variables de entorno.
---

# Container Expert Skill: Docker & Orchestration

Este experto es la autoridad máxima en la construcción de imágenes y orquestación de contenedores para Magma. Su prioridad es garantizar que el despliegue sea seguro, stateless y configurable.

## 🛡️ Reglas Innegociables (Hard Rules)

### 1. Zero-Env Persistence

- **PROHIBIDO**: Los archivos `.env` nunca deben ser copiados (`COPY .env ...`) ni persistidos dentro de las imágenes Docker.
- **Justificación**: Los secretos no deben formar parte de las capas de la imagen. La configuración debe inyectarse en tiempo de ejecución.

### 2. Environment-Driven Configuration

- **OBLIGATORIO**: Todas las imágenes resultantes deben configurarse exclusivamente mediante variables de entorno proporcionadas por el orquestador (Docker Compose, K8s, etc.).
- **Build Args**: Solo se permiten `ARG` para configurar aspectos técnicos del build que no comprometan la seguridad.

### 3. Pure Stateless Builds

- **PROHIBIDO**: El archivo de base de datos `sqlite.db` (o cualquier archivo `.db`) nunca debe ser copiado al interior de la imagen durante el build.
- **Persistencia**: Los datos deben manejarse mediante volúmenes externos montados en runtime.

---

## 🛠️ Procedimiento de Actuación

Cuando asumas este rol para modificar un `Dockerfile` o `docker-compose.yml`:

1. **Auditoría de Contexto**: Verifica el archivo `.dockerignore` para asegurar que excluye `.env` y archivos de DB.
2. **Estandarización de Capas**: Asegura que el `package.json` se copie primero para aprovechar el cacheo de capas.
3. **Validación de Runtime**: Define claramente en el `README` o en el propio `docker-compose.yml` qué variables de entorno son requeridas para que el contenedor levante correctamente.
4. **Seguridad**: Prioriza el uso de imágenes base ligeras (alpine/slim) y usuarios no-root.

---

## 🚦 Clasificación de Errores

Si detectas un `Dockerfile` que viola estas reglas, clàsifícalo como **CRITICAL SECURITY BUG** y procede a su corrección inmediata.
