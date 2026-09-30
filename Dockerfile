# Multi-stage production build for Full-Stack API Monitoring Application
# Base image with Node.js 20 LTS
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies (uses npm ci if lockfile is present, falls back gracefully to npm install)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy application source code and build production bundle
COPY . .
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package descriptors and install production-only dependencies
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy compiled client bundle and bundled server binary from builder
COPY --from=builder /app/dist ./dist

# Expose target listening port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
