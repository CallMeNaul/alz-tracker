
FROM node:18-alpine

WORKDIR /app

# Install required dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy diagnostic service files
COPY ./backend/diagnostic-service/ ./
COPY ./src/services/database.ts ./src/services/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1

CMD ["node", "index.js"]
