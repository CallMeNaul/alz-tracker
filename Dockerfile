FROM node:18-alpine AS builder

# Thêm các dependencies cần thiết cho build
RUN apk add --no-cache g++ make python3

WORKDIR /build

# Copy các file package từ thư mục hiện tại
COPY package*.json ./
COPY bun.lockb ./

# Cài đặt dependencies với các flag bảo mật
RUN npm ci --ignore-scripts --no-optional --production --audit=false \
  && npm install vite@latest esbuild@latest --save-dev \
  && npm cache clean --force

# Copy mã nguồn frontend
COPY src/ ./src/
COPY public/ ./public/
COPY *.json ./
COPY *.js ./
COPY *.ts ./
COPY index.html ./

# Copy env-example thành .env
COPY ./env-example .env

# Build ứng dụng với NODE_ENV=production
ENV NODE_ENV=production
RUN npm run build

# Giai đoạn production
FROM nginx:alpine

# Thêm labels để dễ quản lý
LABEL maintainer="Alzheimer's Data Hub" \
  description="Ứng dụng Frontend cho Alzheimer's Data Hub" \
  version="1.0"

# Cài đặt các gói bảo mật cần thiết
RUN apk add --no-cache dumb-init

# Copy cấu hình nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy các file đã build từ giai đoạn builder
COPY --from=builder /build/dist /usr/share/nginx/html

# Thiết lập quyền truy cập phù hợp
RUN chown -R nginx:nginx /usr/share/nginx/html && \
  chmod -R 755 /usr/share/nginx/html && \
  chown -R nginx:nginx /var/cache/nginx && \
  chown -R nginx:nginx /var/log/nginx && \
  chown -R nginx:nginx /etc/nginx/conf.d && \
  touch /var/run/nginx.pid && \
  chown -R nginx:nginx /var/run/nginx.pid

# Chuyển sang user không phải root
USER nginx

# Mở cổng
EXPOSE 80

RUN echo '#!/bin/sh\nwget -qO- http://localhost:80/ || exit 1' > healthcheck.sh && \
  chmod +x healthcheck.sh

# Cấu hình kiểm tra sức khỏe
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ["./healthcheck.sh"]

# Sử dụng dumb-init để xử lý signals đúng cách
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
