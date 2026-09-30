# Multi-stage production build for Full-Stack API Monitoring Application
# Base image with Node.js 20 LTS
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package descriptors and install production-only dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled client bundle and bundled server binary from builder
COPY --from=builder /app/dist ./dist

# Expose target listening port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
