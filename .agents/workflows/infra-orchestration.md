---
description: Pipeline para orquestar la infraestructura, contenedores y flujos de release de Magma.
---

# Workflow: Infra Orchestration & Release

Este comando se utiliza para diseñar e implementar la estrategia de despliegue de Magma.

## 🚀 Pasos del Workflow

### 1. Diagnóstico de Infraestructura

Analizar el estado actual del proyecto:

- Puertos utilizados por `core` y `app`.
- Variables de entorno críticas.
- Existencia de archivos de release previos.

### 2. Diseño de la Solución (Container & DevOps Expert)

Utilizar las skills [**container-expert**](file:///Users/ote/IdeaProjects/Magma/.agents/skills/container-expert/SKILL.md) y [**devops-engineer**](file:///Users/ote/IdeaProjects/Magma/.agents/skills/devops-engineer/SKILL.md) para proponer una arquitectura de despliegue:

- Estructura de contenedores segura y stateless (Docker).
- Configuración del Reverse Proxy (Nginx).
- Definición de los pasos de CI/CD.

### 3. Implementación de Artefactos de Release

Generar los archivos necesarios bajo la supervisión de la skill **container-expert**:

- `Dockerfile` para Backend y Frontend (sin persistencia de .env ni DB).
- `docker-compose.yml` para orquestación local/staging con inyección de variables de entorno.
- `nginx.conf` optimizado para Magma.
- `.github/workflows/deploy.yml` (si aplica).

### 4. Simulación y Validación

- Proponer cambios en los scripts de `package.json` para facilitar el despliegue.
- Validar sintaxis de archivos de configuración.

---

## 🚦 Cuándo usar este comando

- Cuando se desea preparar el proyecto para un entorno de Staging o Producción.
- Al añadir un nuevo servicio que requiera cambios en el Reverse Proxy.
- Al automatizar el flujo de despliegue continuo.
