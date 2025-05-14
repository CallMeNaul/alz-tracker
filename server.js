
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Cấu hình ứng dụng
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối đến PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'alzheimer_diagnosing',
  ssl: false//process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Hàm query trợ giúp
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

// Khởi tạo database và bảng
const initializeDatabase = async () => {
  try {
    // Auth table
    await query(`
      CREATE TABLE IF NOT EXISTS auth (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        doctor_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Diagnostics table
    await query(`
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
    `);

    // MRI scans table
    await query(`
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
    `);

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
};

// Cấu hình lưu trữ tệp tin
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// API AUTH
// Đăng ký
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName, role, doctorId } = req.body;
    
    // Kiểm tra nếu người dùng đã tồn tại
    const existingUser = await query(
      'SELECT * FROM auth WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }
    
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Tạo ID duy nhất
    const uid = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Tạo người dùng trong bảng auth
    await query(
      `INSERT INTO auth (id, email, password) VALUES ($1, $2, $3)`,
      [uid, email, hashedPassword]
    );
    
    // Tạo người dùng trong bảng users
    await query(
      `INSERT INTO users (id, email, display_name, role, doctor_id) VALUES ($1, $2, $3, $4, $5)`,
      [uid, email, displayName, role, doctorId || null]
    );
    
    res.status(201).json({ 
      message: 'Đăng ký thành công',
      user: { uid, email, displayName, role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Đăng nhập
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Lấy người dùng từ bảng auth
    const authResult = await query(
      'SELECT * FROM auth WHERE email = $1',
      [email]
    );
    
    const authUser = authResult.rows[0];
    if (!authUser) {
      return res.status(400).json({ error: 'Email hoặc mật khẩu không hợp lệ' });
    }
    
    // So sánh mật khẩu
    const passwordMatch = await bcrypt.compare(password, authUser.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Email hoặc mật khẩu không hợp lệ' });
    }
    
    // Lấy dữ liệu người dùng
    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [authUser.id]
    );
    
    const userData = userResult.rows[0];
    
    res.status(200).json({
      message: 'Đăng nhập thành công',
      user: {
        uid: authUser.id,
        email: authUser.email,
        displayName: userData.display_name,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// API DIAGNOSTICS
// Tạo chẩn đoán
app.post('/api/diagnostics', async (req, res) => {
  try {
    const { patientName, age, mmseScore, cdRating, notes, userId } = req.body;
    
    const result = await query(
      `INSERT INTO diagnostics (patient_name, age, mmse_score, cd_rating, notes, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [patientName, age, mmseScore, cdRating, notes, userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating diagnostic:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Lấy chẩn đoán theo ID người dùng
app.get('/api/diagnostics/user/:userId', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM diagnostics WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Lấy chẩn đoán theo tên bệnh nhân
app.get('/api/diagnostics/patient/:patientName', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM diagnostics WHERE patient_name = $1 ORDER BY created_at DESC',
      [req.params.patientName]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Lấy tất cả chẩn đoán
app.get('/api/diagnostics', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM diagnostics ORDER BY created_at DESC'
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// API MRI
// Tải lên ảnh MRI
app.post('/api/mri/upload', upload.single('mriScan'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có tệp nào được tải lên' });
    }
    
    const { userId } = req.body;
    const id = uuidv4();
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    
    // Lưu thông tin ảnh MRI vào cơ sở dữ liệu
    await query(
      `INSERT INTO mri_scans (id, file_name, file_size, user_id, status) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, fileName, fileSize, userId, 'pending']
    );
    
    // Mô phỏng xử lý (trong thực tế sẽ được thực hiện bởi một AI model)
    setTimeout(async () => {
      await query(
        `UPDATE mri_scans SET status = 'processed' WHERE id = $1`,
        [id]
      );
      
      // Mô phỏng phân tích
      setTimeout(async () => {
        // Kết quả chẩn đoán ngẫu nhiên để minh họa
        const diagnoses = ['AD', 'MCI', 'CN'];
        const diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
        const mmseScore = Math.floor(Math.random() * 30);
        const confidence = Math.random() * 0.5 + 0.5; // 0.5-1.0
        
        await query(
          `UPDATE mri_scans SET 
           status = 'analyzed', 
           diagnosis = $1, 
           mmse_score = $2, 
           confidence = $3 
           WHERE id = $4`,
          [diagnosis, mmseScore, confidence, id]
        );
      }, 5000);
    }, 3000);
    
    res.status(201).json({ 
      message: 'Tải lên ảnh MRI thành công',
      id,
      fileName,
      fileSize
    });
  } catch (error) {
    console.error('Error uploading MRI scan:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Lấy ảnh MRI theo ID người dùng
app.get('/api/mri/user/:userId', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM mri_scans WHERE user_id = $1 ORDER BY upload_date DESC',
      [req.params.userId]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting MRI scans:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Lấy ảnh MRI theo ID
app.get('/api/mri/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM mri_scans WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ảnh MRI' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error getting MRI scan:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Phục vụ các tệp tin tĩnh trong môi trường sản xuất
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Khởi tạo cơ sở dữ liệu và khởi động server
const startServer = async () => {
  try {
    // Khởi tạo cơ sở dữ liệu
    await initializeDatabase();
    
    // Khởi động server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
