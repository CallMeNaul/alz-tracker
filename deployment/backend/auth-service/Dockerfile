
FROM node:18-alpine

WORKDIR /app

# Install required dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy auth service files
COPY ./backend/auth-service/ ./
COPY ./src/services/localAuth.ts ./src/services/
COPY ./src/services/database.ts ./src/services/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "index.js"]
