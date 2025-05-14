
-- Tạo bảng cho Ứng dụng chẩn đoán Alzheimer

-- Bảng Auth
CREATE TABLE IF NOT EXISTS auth (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Users
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  doctor_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Diagnostics
CREATE TABLE IF NOT EXISTS diagnostics (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  mmse_score INTEGER NOT NULL,
  cd_rating VARCHAR(50) NOT NULL,
  notes TEXT,
  user_id VARCHAR(255) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng MRI scans
CREATE TABLE IF NOT EXISTS mri_scans (
  id VARCHAR(255) PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  user_id VARCHAR(255) REFERENCES users(id),
  mmse_score INTEGER,
  diagnosis VARCHAR(50),
  confidence FLOAT
);

-- Thêm một số dữ liệu mẫu (chỉ cho môi trường phát triển)
INSERT INTO auth (id, email, password) VALUES 
('admin123', 'admin@example.com', '$2b$10$YiWfF9YBesC.i6T7lDB5G.NwrSeiDGqwqwsJnfZvGUkP3sDbFhJ2G') -- mật khẩu là "admin123"
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, display_name, role) VALUES 
('admin123', 'admin@example.com', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
