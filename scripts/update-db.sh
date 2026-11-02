#!/usr/bin/env bash
# ==============================================================================
# Magma - Database Schema Update Script
#
# Aplica la migración del campo 'is_ignored' en la tabla 'users' de forma
# segura, idempotente y creando una copia de seguridad previa.
#
# Uso:
#   ./scripts/update-db.sh                     # Actualiza todas las BDs detectadas
#   ./scripts/update-db.sh core/data/sqlite.prod.db  # Actualiza una BD específica
# ==============================================================================

set -euo pipefail

# Colores para la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}  Magma: Actualizador de Esquema SQLite       ${NC}"
echo -e "${BLUE}==============================================${NC}"

migrate_database() {
    local db_path="$1"

    if [ ! -f "$db_path" ]; then
        echo -e "${YELLOW}⚠️  El archivo de base de datos no existe: ${db_path}${NC}"
        return 0
    fi

    echo -e "\n${BLUE}🔍 Procesando base de datos:${NC} ${db_path}"

    # 1. Crear backup de seguridad antes de modificar
    local timestamp
    timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_path="${db_path}.bak.${timestamp}"
    
    cp "$db_path" "$backup_path"
    echo -e "  ${GREEN}✓${NC} Copia de seguridad creada: ${backup_path}"

    # 2. Ejecutar la migración mediante Python (módulo sqlite3 nativo)
    python3 - <<EOF
import sqlite3
import sys

db_file = "$db_path"
try:
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    # Verificar si la tabla users existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("  ⚠️  La tabla 'users' no existe aún. Nada que migrar.")
        sys.exit(0)

    # Verificar columnas actuales
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]

    if 'is_ignored' in columns:
        print("  ℹ️  La columna 'is_ignored' ya existe en 'users'.")
    else:
        cursor.execute("ALTER TABLE users ADD COLUMN is_ignored INTEGER NOT NULL DEFAULT 0")
        conn.commit()
        print("  ✅ Migración aplicada con éxito: Columna 'is_ignored' agregada a 'users'.")

    # Verificar columna process_type en sync_logs
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sync_logs'")
    if cursor.fetchone():
        cursor.execute("PRAGMA table_info(sync_logs)")
        sync_cols = [row[1] for row in cursor.fetchall()]
        if 'process_type' in sync_cols:
            print("  ℹ️  La columna 'process_type' ya existe en 'sync_logs'.")
        else:
            cursor.execute("ALTER TABLE sync_logs ADD COLUMN process_type TEXT DEFAULT 'sync'")
            cursor.execute("UPDATE sync_logs SET process_type = 'billing' WHERE summary LIKE '%Facturación%' OR summary LIKE '%Cobro%' OR summary LIKE '%Procesados%'")
            conn.commit()
            print("  ✅ Migración aplicada con éxito: Columna 'process_type' agregada a 'sync_logs'.")

    conn.close()
except Exception as e:
    print(f"  ❌ Error al migrar: {e}", file=sys.stderr)
    sys.exit(1)
EOF

    echo -e "  ${GREEN}✓${NC} Proceso finalizado para ${db_path}"
}

# Si se pasó un parámetro específico, procesar solo ese
if [ $# -ge 1 ]; then
    migrate_database "$1"
else
    # Si no se pasó argumento, buscar las bases de datos comunes del proyecto
    TARGET_DBS=(
        "core/data/sqlite.prod.db"
        "core/data/sqlite.db"
        "data/sqlite.db"
        "data/sqlite.prod.db"
    )

    found_any=false
    for db in "${TARGET_DBS[@]}"; do
        if [ -f "$db" ]; then
            found_any=true
            migrate_database "$db"
        fi
    done

    if [ "$found_any" = false ]; then
        echo -e "${YELLOW}No se encontraron bases de datos en las rutas por defecto.${NC}"
        echo -e "Puedes especificar la ruta manualmente:"
        echo -e "  ${BLUE}./scripts/update-db.sh ruta/a/tu/sqlite.db${NC}"
    fi
fi

echo -e "\n${GREEN}✨ Todas las migraciones han sido procesadas.${NC}\n"
