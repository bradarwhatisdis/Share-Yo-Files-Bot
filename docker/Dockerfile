# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine-slim

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.example ./

# Create data directory
RUN mkdir -p /app/data /tmp/mirrorbot

# Set environment
ENV NODE_ENV=production

# Expose ports
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
