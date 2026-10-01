# Multi-stage production build for Full-Stack API Monitoring Application
# Use Debian-based node:20-slim for robust glibc prebuilt binary compatibility (esbuild, tsx, etc.)
FROM node:20-slim AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install dependencies (handles both fresh lockfiles and fallback)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy application source code and build production bundle
COPY . .
RUN npm run build

# Remove development-only dependencies directly in builder
RUN npm prune --omit=dev

# Production runner stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package descriptors, pruned production node_modules, and compiled output from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expose target listening port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
