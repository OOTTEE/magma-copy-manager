# stage 1: builds the frontend application
FROM node:22-alpine AS build

WORKDIR /home/node/app

# Copy package files from app directory
COPY app/package*.json ./
RUN npm install

# Copy openapi generator file from root
COPY openapi.yaml ../

# Copy the rest of the application
COPY app/ .

# Build the application (generates /dist)
RUN npm run build

# stage 2: production runtime with nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /home/node/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
# Assuming the docker context is the project root
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
