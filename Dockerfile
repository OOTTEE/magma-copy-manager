# Stage 1: Builds the frontend application
FROM node:22-alpine AS frontend-build

WORKDIR /app

# Copy package files
COPY app/package*.json ./
RUN npm install

# Copy openapi generator file from root (needed for gen:api script)
COPY openapi.yaml /openapi.yaml

# Copy the rest of the application
COPY app/ .

# Force VITE_SERVICE_URL to / for production container
ENV VITE_SERVICE_URL=/

# Build the application (generates /dist)
RUN npm run build

# Stage 2: Builds the backend
FROM node:22-slim AS backend-build

# Install native dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

COPY core/package*.json ./
RUN npm install

COPY core/ .
RUN npm run gen:nexudus \
    && npm run build

# Stage 3: Production runtime
FROM node:22-slim

# Install system dependencies for better-sqlite3 and Playwright
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

# Copy built backend files and production dependencies
COPY --from=backend-build /home/node/app/dist ./dist
COPY --from=backend-build /home/node/app/package*.json ./
COPY --from=backend-build /home/node/app/node_modules ./node_modules
COPY --from=backend-build /home/node/app/drizzle.config.ts ./
COPY --from=backend-build /home/node/app/db ./db
COPY --from=backend-build /home/node/app/config ./config
COPY --from=backend-build /home/node/app/drizzle ./drizzle

# Copy frontend assets from build stage to backend's public folder
COPY --from=frontend-build /app/dist ./dist/public

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
ENV DATABASE_URL=/home/node/app/data/sqlite.db

ENTRYPOINT ["/home/node/app/entrypoint.sh"]
CMD ["npm", "run", "start"]
