#!/bin/sh
set -e

# Default path if not set (matches server.config.ts)
RAW_DB_URL=${DATABASE_URL:-/home/node/app/data/sqlite.db}
# Remove file: prefix if present to check for existence
DB_PATH=$(echo $RAW_DB_URL | sed 's/^file://')

echo "--------------------------------------------------"
echo "Database Initialization"
echo "Target: $DB_PATH"
echo "--------------------------------------------------"

# Extract version from package.json
APP_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")
VERSION_FILE="$(dirname "$DB_PATH")/.last_version"
LAST_VERSION=""

if [ -f "$VERSION_FILE" ]; then
    LAST_VERSION=$(cat "$VERSION_FILE")
fi

echo "Current app version: $APP_VERSION"
echo "Last deployed version: ${LAST_VERSION:-none}"

# Run migrations ONLY if version changed OR DB doesn't exist
if [ ! -f "$DB_PATH" ] || [ "$APP_VERSION" != "$LAST_VERSION" ]; then
    echo "--------------------------------------------------"
    echo "Version change detected or fresh install. Syncing DB..."
    
    if [ -f "$DB_PATH" ]; then
        echo "Creating safety backup for version $LAST_VERSION..."
        BKP_DIR="$(dirname "$DB_PATH")/bkp"
        mkdir -p "$BKP_DIR"
        BKP_FILE="$BKP_DIR/sqlite_v${LAST_VERSION}_$(date +%Y%m%d_%H%M%S).db"
        cp "$DB_PATH" "$BKP_FILE"
        echo "Backup created at: $BKP_FILE"
    else
        echo "New installation. Initializing database..."
    fi

    # Run drizzle-kit push to ensure schema is up to date
    npm run db:push
    
    # Update version stamp after successful push
    echo "$APP_VERSION" > "$VERSION_FILE"
    echo "Database synchronized successfully."
    echo "--------------------------------------------------"
else
    echo "--------------------------------------------------"
    echo "Database already at version $APP_VERSION. Skipping migrations."
    echo "--------------------------------------------------"
fi

echo "--------------------------------------------------"
echo "Starting application..."
echo "--------------------------------------------------"

exec "$@"
