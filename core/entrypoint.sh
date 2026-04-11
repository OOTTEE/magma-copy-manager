#!/bin/sh
set -e

# Default path if not set (matches server.config.ts)
RAW_DB_URL=${DATABASE_URL:-/home/node/app/sqlite.db}
# Remove file: prefix if present to check for existence
DB_PATH=$(echo $RAW_DB_URL | sed 's/^file://')

echo "--------------------------------------------------"
echo "Database Initialization"
echo "Target: $DB_PATH"
echo "--------------------------------------------------"

if [ ! -f "$DB_PATH" ]; then
    echo "Database file not found. Initializing..."
else
    echo "Database file exists. Checking for changes..."
fi

# Run drizzle-kit push to ensure schema is up to date
# This will create the file if it doesn't exist.
npm run db:push

echo "--------------------------------------------------"
echo "Starting application..."
echo "--------------------------------------------------"

exec "$@"
