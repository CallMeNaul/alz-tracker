
FROM postgres:14-alpine

# Environment variables for initial database setup will be provided via docker-compose.yml
# Create custom initialization scripts
COPY ./init-scripts/ /docker-entrypoint-initdb.d/

EXPOSE 5432

# Use health check to ensure the database is ready
HEALTHCHECK --interval=5s --timeout=5s --retries=3 \
  CMD pg_isready -U postgres || exit 1
