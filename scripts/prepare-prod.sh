#!/bin/bash

# Script to help prepare the production environment for Magma

echo "🚀 Preparing Magma Production Environment..."

# Generate a secure encryption key if not exists
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 32)
    
    cat > .env <<EOL
# --- SECURITY ---
NODE_ENV=production
ENCRYPTION_KEY=$ENCRYPTION_KEY
JWT_SECRET=$JWT_SECRET

# --- NEXUDUS ---
NEXUDUS_USER=admin@example.com
NEXUDUS_PASS=change_me

# --- APP ---
VITE_SERVICE_URL=/
EOL
    echo "✅ .env created with random keys."
    echo "⚠️  IMPORTANT: Edit .env and set your NEXUDUS_USER and NEXUDUS_PASS."
else
    echo "ℹ️  .env already exists. Skipping creation."
fi

# Ensure storage directory exists
mkdir -p storage
echo "✅ Storage directory created."

echo "✨ Ready to run: docker compose up -d --build"
