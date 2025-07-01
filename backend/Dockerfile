FROM node:18-alpine AS builder

# Thêm các dependencies cần thiết cho build
RUN apk add --no-cache python3 make g++

WORKDIR /build

# Copy các file package
COPY backend/package*.json ./

# Cài đặt dependencies với các flag bảo mật
RUN npm install

# Giai đoạn production
FROM node:18-alpine

# Cài đặt các gói bảo mật cần thiết
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy các dependencies đã build từ giai đoạn builder
COPY --from=builder /build/node_modules ./node_modules

# Copy mã nguồn ứng dụng
COPY backend/server.js ./
COPY backend/env-example .env

# Tạo thư mục uploads với quyền truy cập phù hợp
RUN mkdir -p uploads && \
    chown -R node:node /app && \
    chmod -R 755 /app

# Sử dụng user không phải root
USER node

# Các biến môi trường
ENV PORT=process.env.SERVER_PORT \
    NODE_ENV=production \
    DB_HOST=process.env.DB_HOST \
    DB_PORT=process.env.DB_PORT \
    DB_USER=process.env.DB_USER \
    DB_PASSWORD=process.env.DB_PASSWORD \
    DB_NAME=process.env.DB_NAME

EXPOSE 8888

# Kiểm tra sức khỏe với timeout và số lần thử lại
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8888/ || exit 1

# Sử dụng dumb-init để xử lý signals đúng cách
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "--no-deprecation", "--no-warnings", "backend/server.js"]