
FROM node:18-alpine

WORKDIR /app

# Install required dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy MRI service files
COPY ./backend/mri-service/ ./
COPY ./src/services/database.ts ./src/services/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3003

EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["node", "index.js"]
