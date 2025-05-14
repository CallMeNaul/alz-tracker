
FROM node:18-alpine as build

WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các phụ thuộc
RUN npm ci

# Sao chép mã nguồn
COPY . .

# Xây dựng ứng dụng frontend
RUN npm run build

# Giai đoạn sản xuất
FROM node:18-alpine as production

WORKDIR /app

# Cài đặt các phụ thuộc sản xuất
COPY ./deployment/package*.json ./
RUN npm install

# Sao chép các tệp đã xây dựng từ giai đoạn trước
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./

# Tạo thư mục uploads
RUN mkdir -p uploads

# Biến môi trường
ENV PORT=8080
ENV NODE_ENV=production
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV DB_NAME=alzheimer_diagnosing

EXPOSE 8080

# Kiểm tra sức khỏe
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

# Khởi động ứng dụng
CMD ["node", "server.js"]
