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
# Ensure pnpm is available (useful if running in environments without pre-installed pnpm)
if ! command -v pnpm &> /dev/null; then
  echo "   - pnpm no encontrado, intentando habilitar via corepack..."
  corepack enable && corepack prepare pnpm@latest --activate
fi

pnpm install

# 1. Limpiar el environment
echo "🧹 Paso 1: Limpiando environment..."
pnpm clean

# 2. Actualizar versión
echo "🔢 Paso 2: Actualizando versión..."

# Get bump type from argument (default to minor)
BUMP_TYPE=${1:-minor}
# Map bugfix to patch (npm standard)
if [ "$BUMP_TYPE" = "bugfix" ]; then
  BUMP_TYPE="patch"
fi

echo "   - Tipo de incremento: $BUMP_TYPE"

# Bumps root package.json
# Note: Using npm version is still fine for bumping package.json, 
# but we could also use 'pnpm version' if desired.
npm version $BUMP_TYPE --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ Nueva versión detectada: $NEW_VERSION"

# 3. Sincronizar versiones a sub-proyectos
echo "🔄 Paso 3: Sincronizando versiones a core/ y app/..."
node -e "const fs = require('fs'); ['core', 'app'].forEach(dir => { const p = dir + '/package.json'; if (fs.existsSync(p)) { const pkg = JSON.parse(fs.readFileSync(p)); pkg.version = '$NEW_VERSION'; fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n'); console.log('   - ' + p + ' actualizado a ' + pkg.version); } })"

# 4. Build completa
echo "🏗️  Paso 4: Realizando build completa (Back + Front + OpenAPI)..."
pnpm build

# 5. Ejecutar tests
echo "🧪 Paso 5: Ejecutando tests..."
# Asegurar directorio de datos por si otros servicios lo requieren
mkdir -p core/data
pnpm test


# 6. Build de contenedores
echo "🐳 Paso 6: Construyendo imágenes de contenedores..."
docker compose build

echo "✨ Release $NEW_VERSION completada con éxito."
