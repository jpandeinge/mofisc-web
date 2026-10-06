# Multi-stage build for React application

# Stage 1: Build the application
FROM node:22-alpine AS build

WORKDIR /app

# Copy the dependency manifest and lockfile
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
ARG REACT_APP_API_URL
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_ANON_KEY
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_STORAGE_BUCKET
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_FIREBASE_APP_ID
ARG REACT_APP_FIREBASE_VAPID_KEY
ARG REACT_APP_SENTRY_DSN
RUN npm run build

# Stage 2: Development (for local development only)
FROM node:22-alpine AS development

WORKDIR /app

# Copy the dependency manifest and lockfile
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port 3000 for development server
EXPOSE 3000

# Start development server
CMD ["npm", "start"]

# Stage 3: Production - Serve static files with security headers
FROM node:22-alpine AS production

WORKDIR /app

# Copy built files and the custom server from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/server.js ./server.js
USER node

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Run the production server (sets CSP, HSTS, X-Frame-Options, etc.)
CMD ["node", "server.js"]
