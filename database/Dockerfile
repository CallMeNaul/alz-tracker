FROM postgres:14-alpine

# Thêm labels để dễ quản lý
LABEL maintainer="Alzheimer's Data Hub" \
  description="Cơ sở dữ liệu PostgreSQL cho Alzheimer's Data Hub" \
  version="1.0"

# Cài đặt các gói bảo mật cần thiết
RUN apk add --no-cache \
  su-exec \
  tzdata \
  && rm -rf /var/cache/apk/*

# Tạo thư mục cho các script khởi tạo và data
RUN mkdir -p /docker-entrypoint-initdb.d \
  && mkdir -p /var/lib/postgresql/data \
  && chown -R postgres:postgres /var/lib/postgresql/data \
  && chmod 700 /var/lib/postgresql/data

# Copy các script khởi tạo
COPY init-scripts/ /docker-entrypoint-initdb.d/

# Thiết lập quyền truy cập cho các script và thư mục
RUN chown -R postgres:postgres /docker-entrypoint-initdb.d \
  && chmod -R 755 /docker-entrypoint-initdb.d

# Thiết lập biến môi trường bảo mật
ENV LANG=en_US.utf8 \
  POSTGRES_HOST_AUTH_METHOD=scram-sha-256 \
  POSTGRES_INITDB_ARGS="--auth-host=scram-sha-256" \
  PGDATA=/var/lib/postgresql/data

# Mở cổng PostgreSQL
EXPOSE 5432

# Chuyển sang user postgres
USER postgres

# Cấu hình kiểm tra sức khỏe với các khoảng thời gian phù hợp
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD pg_isready -U postgres -d ${POSTGRES_DB:-postgres} || exit 1
