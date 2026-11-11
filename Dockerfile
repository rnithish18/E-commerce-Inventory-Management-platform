# ============================================================
# ShopNest — Multi-stage Dockerfile for single-service deploy
# Builds the Vite frontend, compiles the Express backend,
# then serves everything from one container.
# ============================================================

# ---------- Stage 1: Build Frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Output: /build/frontend/dist

# ---------- Stage 2: Build Backend ----------
FROM node:20-alpine AS backend-build
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build
# Output: /build/backend/dist

# ---------- Stage 3: Production Runtime ----------
FROM node:20-alpine AS runtime

# Add non-root user for security
RUN addgroup -S shopnest && adduser -S shopnest -G shopnest

WORKDIR /app

# Install only production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled backend
COPY --from=backend-build /build/backend/dist ./dist

# Copy compiled frontend into public/ (Express will serve this)
COPY --from=frontend-build /build/frontend/dist ./public

# Copy database migrations and seed (for running migrate:up inside the container)
COPY database/ ./database/

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R shopnest:shopnest /app

# Switch to non-root user
USER shopnest

# Expose the API port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
