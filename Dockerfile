# Stage 1: Builds the frontend application
FROM node:24-alpine AS frontend-build

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json ./
COPY app/package.json ./app/

# Install dependencies using workspace
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --filter app...

# Copy openapi generator file from root (needed for gen:api script)
COPY openapi.yaml /openapi.yaml

# Copy the rest of the application
COPY app/ ./app/
WORKDIR /app/app

# Force VITE_SERVICE_URL to / for production container
ENV VITE_SERVICE_URL=

# Build the application (generates /dist)
RUN pnpm build

# Stage 2: Builds the backend
FROM node:24-slim AS backend-build

# Install native dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json ./
COPY core/package.json ./core/

# Install dependencies using workspace
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --filter core...

COPY core/ ./core/
WORKDIR /app/core
RUN pnpm gen:nexudus \
    && pnpm build

# Stage 3: Production runtime
FROM node:24-slim

# Install system dependencies for better-sqlite3 and Playwright
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

# Copy built backend files and production dependencies
COPY --from=backend-build /app/core/dist ./dist
COPY --from=backend-build /app/core/package.json ./
COPY --from=backend-build /app/core/node_modules ./node_modules
COPY --from=backend-build /app/core/drizzle.config.ts ./
COPY --from=backend-build /app/core/db ./db
COPY --from=backend-build /app/core/config ./config
COPY --from=backend-build /app/core/drizzle ./drizzle

# Copy frontend assets from build stage to backend's public folder
COPY --from=frontend-build /app/app/dist ./dist/public

COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

# Install Playwright browsers and their system dependencies
RUN npx playwright install --with-deps firefox

# Ensure storage directory exists for volume mounting
RUN mkdir -p /home/node/app/data/storage

# Configuration
EXPOSE 80

ENV NODE_ENV=production
ENV PORT=80

ENTRYPOINT ["/home/node/app/entrypoint.sh"]
CMD ["node", "dist/server.js"]
