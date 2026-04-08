# stage 1: builds the backend
FROM node:22-alpine AS build

# Install native dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /home/node/app

COPY core/package*.json ./
RUN npm install

COPY core/ .
RUN npm run build

# stage 2: production runtime
FROM node:22-alpine

# Better-sqlite3 might require python/make if it needs to recompile for alpine during run
# but usually copying node_modules from the build stage is enough if both are alpine.
RUN apk add --no-cache python3 make g++

WORKDIR /home/node/app

# Copy built files and production dependencies
COPY --from=build /home/node/app/dist ./dist
COPY --from=build /home/node/app/package*.json ./
COPY --from=build /home/node/app/node_modules ./node_modules

# Ensure storage directory exists for volume mounting
RUN mkdir -p /home/node/app/storage

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "run", "start"]
