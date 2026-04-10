# Guía de Despliegue en Producción (Magma)

Esta guía detalla cómo instalar y ejecutar Magma en un servidor Linux limpio con Docker.

## 1. Requisitos Previos

En tu servidor Linux (Ubuntu/Debian recomendado), instala Docker y Docker Compose:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose (si no viene incluido)
sudo apt install docker-compose-plugin -y
```

## 2. Preparación del Proyecto

Clona el repositorio en el servidor:

```bash
git clone <URL_DEL_REPOSITORIO> magma
cd magma
```

Crea el archivo `.env` en la raíz (puedes basarte en `core/.env` pero con valores reales):

```bash
touch .env
```

### Configuración del `.env` (Crítico)

Edita el archivo `.env` e incluye lo siguiente:

```ini
# --- SEGURIDAD ---
# Clave de 32 bytes (64 hex chars) para encriptar contraseñas de nexudus en BD
ENCRYPTION_KEY=tu_clave_secreta_aqui_de_64_caracteres_hex
# Secreto para firmar tokens JWT
JWT_SECRET=un_secreto_muy_largo_y_aleatorio

# --- NEXUDUS ---
# Credenciales del usuario administrador principal de Nexudus
NEXUDUS_USER=admin@empresa.com
NEXUDUS_PASS=contraseña_fuerte

# --- SMTP (Opcional, para notificaciones) ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@empresa.com
SMTP_PASS=tu_app_password
```

> [!TIP]
> Para generar una `ENCRYPTION_KEY` segura, puedes usar: `openssl rand -hex 32`

## 3. Despliegue con Docker Compose

Una vez configurado el `.env`, lanza los contenedores:

```bash
# Construir e iniciar en segundo plano
docker compose up -d --build
```

### Verificar estado

```bash
docker compose ps
docker compose logs -f
```

## 4. Persistencia y Backup

Magma utiliza SQLite y una carpeta de almacenamiento. Estos datos se guardan fuera de los contenedores mediante dock definidos en `docker-compose.yml`:

- `./core/sqlite.db`: Base de datos principal.
- `./storage`: Documentos, facturas y logs.

**Recomendación**: Realiza un backup diario de estos archivos/carpetas.

## 5. Acceso

- **App**: `http://<IP_DEL_SERVIDOR>` (Puerto 80 por defecto).
- **Backend API**: `http://<IP_DEL_SERVIDOR>/api`
- **Docs API**: `http://<IP_DEL_SERVIDOR>/docs`

---

## Anexo: Configuración de Dominio y SSL (HTTPS)

Si deseas usar un dominio (ej: `magma.tuempresa.com`), te recomendamos usar **Nginx Proxy Manager** o configurar **Certbot** directamente en el servidor para que actúe como reverse proxy HTTPS apuntando al puerto 80 del contenedor de Magma.
