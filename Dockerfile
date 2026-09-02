# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS build

WORKDIR /src

# Install dependencies first so Docker can reuse this layer when source changes.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:alpine

# Remove the default site and copy only the generated Hugo output.
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /src/public/ /usr/share/nginx/html/
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1
