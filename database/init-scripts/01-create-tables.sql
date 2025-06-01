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
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  age VARCHAR(50),
  gender VARCHAR(10),
  doctor_id VARCHAR(255),
  email VARCHAR(255),
  created_at VARCHAR(10),
  CONSTRAINT proper_role CHECK (role IN ('patient', 'doctor', 'admin'))
);

-- Bảng Diagnostics
CREATE TABLE IF NOT EXISTS diagnostics (
  id SERIAL PRIMARY KEY,
  age INTEGER NOT NULL,
  cd_rating VARCHAR(50) NOT NULL,
  mmse_score INTEGER NOT NULL,
  notes TEXT,
  patient_name VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  user_id VARCHAR(255) REFERENCES users(id)
);

-- Bảng Diagnosis Tests
CREATE TABLE IF NOT EXISTS diagnosis_tests (
  id SERIAL PRIMARY KEY,
  attention_test INTEGER CHECK (attention_test BETWEEN 0 AND 5),
  cd_rating VARCHAR(50) NOT NULL,
  communication_test INTEGER CHECK (communication_test BETWEEN 0 AND 5),
  doctor_email VARCHAR(255),
  doctor_notes TEXT,
  memory_test INTEGER CHECK (memory_test BETWEEN 0 AND 5),
  mmse_score INTEGER CHECK (mmse_score BETWEEN 0 AND 30),
  orientation_test INTEGER CHECK (orientation_test BETWEEN 0 AND 5),
  patient_age INTEGER,
  patient_name VARCHAR(255),
  recommendations TEXT,
  timestamp TIMESTAMP,
  user_id VARCHAR(255) REFERENCES users(id),
  visual_spatial_test INTEGER CHECK (visual_spatial_test BETWEEN 0 AND 5)
);

-- Bảng Progress Notes
CREATE TABLE IF NOT EXISTS progress_notes (
  id SERIAL PRIMARY KEY,
  created_by VARCHAR(255),
  notes TEXT,
  patient_age INTEGER,
  patient_id VARCHAR(255),
  patient_name VARCHAR(255),
  status VARCHAR(50),
  timestamp TIMESTAMP,
  user_id VARCHAR(255) REFERENCES users(id)
);

-- Bảng MRI Scans
CREATE TABLE IF NOT EXISTS mri_scans (
  id SERIAL PRIMARY KEY,
  ad_probability FLOAT,
  age VARCHAR(50),
  cn_probability FLOAT,
  confidence FLOAT,
  diagnosis VARCHAR(50),
  file_name VARCHAR(255),
  file_size INTEGER,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  mmse_score FLOAT,
  status VARCHAR(50),
  upload_date TIMESTAMP,
  user_id VARCHAR(255) REFERENCES users(id)
);

-- Bảng Forum Topics
CREATE TABLE IF NOT EXISTS forum_topics (
  id SERIAL PRIMARY KEY,
  author_id VARCHAR(255) REFERENCES users(id),
  author_name VARCHAR(255),
  category VARCHAR(50),
  content TEXT,
  reply_count INTEGER DEFAULT 0,
  role VARCHAR(50),
  timestamp TIMESTAMP,
  title VARCHAR(255)
);

-- Bảng Forum Replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id SERIAL PRIMARY KEY,
  author_id VARCHAR(255) REFERENCES users(id),
  author_name VARCHAR(255),
  content TEXT,
  role VARCHAR(50),
  timestamp TIMESTAMP,
  topic_id VARCHAR(255)
);