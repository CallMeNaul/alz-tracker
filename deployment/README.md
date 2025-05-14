
# Triển khai ứng dụng chẩn đoán Alzheimer

Hướng dẫn triển khai ứng dụng sử dụng Docker và Docker Compose.

## Yêu cầu hệ thống

1. Đã cài đặt [Docker](https://docs.docker.com/get-docker/)
2. Đã cài đặt [Docker Compose](https://docs.docker.com/compose/install/)

## Cấu trúc hệ thống

Hệ thống bao gồm hai dịch vụ chính:

1. **postgres**: Cơ sở dữ liệu PostgreSQL
2. **app**: Ứng dụng Node.js chạy Express.js và phục vụ React frontend đã được xây dựng

## Cách triển khai

### 1. Clone repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Xây dựng và khởi động các dịch vụ

```bash
docker-compose up -d
```

Lệnh này sẽ:
- Xây dựng các container từ các Dockerfile
- Tạo các mạng và volumes cần thiết
- Khởi động các dịch vụ trong chế độ tách rời (detached mode)

### 3. Truy cập ứng dụng

Mở trình duyệt web và truy cập:

```
http://localhost:8080
```

## Quản lý các dịch vụ

### Xem logs

```bash
# Xem logs của tất cả các dịch vụ
docker-compose logs

# Xem logs của một dịch vụ cụ thể
docker-compose logs app
docker-compose logs postgres

# Theo dõi logs theo thời gian thực
docker-compose logs -f
```

### Dừng các dịch vụ

```bash
# Dừng tất cả các dịch vụ
docker-compose down

# Dừng và xóa tất cả các dữ liệu (volumes)
docker-compose down -v
```

### Khởi động lại các dịch vụ

```bash
docker-compose restart
```

## Cấu trúc dữ liệu

Cơ sở dữ liệu bao gồm các bảng chính:

1. **auth**: Lưu trữ thông tin xác thực người dùng
2. **users**: Lưu trữ thông tin hồ sơ người dùng
3. **diagnostics**: Lưu trữ thông tin chẩn đoán bệnh nhân
4. **mri_scans**: Lưu trữ thông tin ảnh MRI đã tải lên

## Khắc phục sự cố

### Postgres không khởi động

```bash
# Kiểm tra logs
docker-compose logs postgres

# Đảm bảo ports không bị xung đột
sudo lsof -i :5432
```

### Ứng dụng không kết nối được với cơ sở dữ liệu

```bash
# Kiểm tra logs
docker-compose logs app

# Kiểm tra thông tin mạng
docker network inspect alzheimer-network
```

### Khởi động lại từ đầu

```bash
# Dừng tất cả các container, xóa volumes, networks, images
docker-compose down -v
docker system prune -a

# Khởi động lại
docker-compose up -d
```

## Dành cho nhà phát triển

### 1. Phát triển cục bộ mà không cần Docker

```bash
# Khởi động PostgreSQL bằng Docker
docker-compose up -d postgres

# Cài đặt các phụ thuộc
npm install

# Khởi động ứng dụng ở chế độ phát triển
npm run dev
```

### 2. Thêm dữ liệu mẫu

Xem tệp `deployment/database/init-scripts/01-create-tables.sql` để biết cách thêm dữ liệu mẫu.
