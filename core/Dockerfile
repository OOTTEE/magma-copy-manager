# stage 1: builds the backend
FROM node:22-slim AS build

# Install native dependencies for better-sqlite3
# We use apt-get as we are now on a Debian-based image
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

# stage 2: production runtime
FROM node:22-slim

# Install system dependencies for better-sqlite3 and Playwright
# Playwright needs specific system libraries that are easier to manage in Debian/Ubuntu than Alpine
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

# Copy built files and production dependencies
COPY --from=build /home/node/app/dist ./dist
COPY --from=build /home/node/app/package*.json ./
COPY --from=build /home/node/app/node_modules ./node_modules
COPY --from=build /home/node/app/drizzle.config.ts ./
COPY --from=build /home/node/app/db ./db
COPY --from=build /home/node/app/config ./config
COPY --from=build /home/node/app/drizzle ./drizzle
COPY --from=build /home/node/app/entrypoint.sh ./

RUN chmod +x entrypoint.sh

# Install Playwright browsers and their system dependencies
# We install only Firefox as it is the one used by our scraper to keep the image size optimized
RUN npx playwright install --with-deps firefox

# Ensure storage directory exists for volume mounting
RUN mkdir -p /home/node/app/storage

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

ENTRYPOINT ["/home/node/app/entrypoint.sh"]
CMD ["npm", "run", "start"]
