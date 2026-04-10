#!/bin/bash

# --- Magma Release Script ---
# This script orchestrates the release process for Magma.
# Reglas:
# - Aumento de versión minor por defecto.
# - Garantiza actualización de package.json antes de build.
# - Limpieza, construcción, tests, validación de arranque y dockerización.

set -e

# Configuration
VALIDATION_PORT=3333
RETRIES=30
SKIP_GIT_CHECK=${SKIP_GIT_CHECK:-false}

# Check if we are running inside Docker
if [ -f /.dockerenv ]; then
  echo "🐳 Running inside Docker environment"
  SKIP_GIT_CHECK=true
fi

echo "🚀 Iniciando proceso de Release..."

# 0. Check for uncommitted changes (optional but recommended for releases)
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Atención: Tienes cambios sin confirmar en Git."
  if [ "$SKIP_GIT_CHECK" = "true" ]; then
    echo "ℹ️  Ignorando chequeo de Git (Modo no interactivo/Docker)."
  else
    read -p "¿Deseas continuar de todos modos? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
fi

# 0.5. Asegurar dependencias (necesario si corremos en un contenedor limpio)
echo "📦 Paso 0.5: Asegurando dependencias..."
npm install
npm install --prefix core
npm install --prefix app

# 1. Limpiar el environment
echo "🧹 Paso 1: Limpiando environment..."
npm run clean

# 2. Actualizar versión (minor por defecto)
echo "🔢 Paso 2: Actualizando versión..."
# Bumps root package.json
npm version minor --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ Nueva versión detectada: $NEW_VERSION"

# 3. Sincronizar versiones a sub-proyectos
echo "🔄 Paso 3: Sincronizando versiones a core/ y app/..."
node -e "const fs = require('fs'); ['core', 'app'].forEach(dir => { const p = dir + '/package.json'; if (fs.existsSync(p)) { const pkg = JSON.parse(fs.readFileSync(p)); pkg.version = '$NEW_VERSION'; fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n'); console.log('   - ' + p + ' actualizado a ' + pkg.version); } })"

# 4. Build completa
echo "🏗️  Paso 4: Realizando build completa (Back + Front + OpenAPI)..."
npm run build

# 5. Ejecutar tests
echo "🧪 Paso 5: Corriendo tests..."
npm run test

# 6. Validar arranque de la aplicación
echo "🚦 Paso 6: Validando que la aplicación arranca correctamente..."
# Usamos el core como punto de entrada de la arquitectura
cd core
# Inyectamos variables mínimas para que no falle el arranque en el entorno de build
NODE_ENV=test PORT=$VALIDATION_PORT ENCRYPTION_KEY=temporary-key-for-validation-purposes-only JWT_SECRET=val-secret npm run start > startup_validation.log 2>&1 &
PID=$!

echo "⏳ Esperando a que el servicio esté disponible en el puerto $VALIDATION_PORT..."
VALID=false
for i in $(seq 1 $RETRIES); do
  if curl -s http://localhost:$VALIDATION_PORT/ > /dev/null; then
    echo "✅ Aplicación validada satisfactoriamente en el intento $i."
    VALID=true
    break
  fi
  sleep 1
done

# Cleanup del proceso de validación
kill $PID || true
cd ..

if [ "$VALID" = false ]; then
  echo "❌ ERROR: La aplicación no arrancó correctamente. Revisa core/startup_validation.log"
  exit 1
fi

# 7. Build de contenedores
echo "🐳 Paso 7: Construyendo imágenes de contenedores..."
docker compose build

echo "✨ Release $NEW_VERSION completada con éxito."
