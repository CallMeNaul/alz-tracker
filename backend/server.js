require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const crypto = require('crypto');

// Cấu hình CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Danh sách các domain được phép truy cập
    const allowedOrigins = [
      process.env.FRONTEND_URL, // URL của frontend chính
      'http://localhost:3000',  // URL development
      'https://alzheimers-data-hub.com', // URL production
      'https://admin.alzheimers-data-hub.com' // URL admin panel
    ].filter(Boolean); // Lọc bỏ các giá trị undefined/null

    // Cho phép requests từ Postman/curl trong development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các HTTP methods được phép
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true, // Cho phép gửi cookies
  maxAge: 86400, // Cache CORS preflight requests trong 24 giờ
  exposedHeaders: ['Content-Disposition'], // Headers cho phép client đọc
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Khởi tạo Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

// Cấu hình ứng dụng
const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' })); // Giới hạn kích thước JSON request

// Middleware bảo mật
app.use((req, res, next) => {
  // Thêm các security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Xóa các headers không cần thiết
  res.removeHeader('X-Powered-By');

  next();
});

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn mỗi IP
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút'
});
app.use('/api/', limiter);

// Kết nối đến PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER, // || 'postgres',
  password: process.env.DB_PASSWORD, // || 'postgres',
  host: process.env.DB_HOST, // || 'localhost',
  port: parseInt(process.env.DB_PORT), // || '5432'),
  database: process.env.DB_NAME, // || 'alzheimer_diagnosing',
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
    // Users table
    await query(`
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
    `);

    // Diagnostics table
    await query(`
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
    `);

    // Diagnosis Tests table
    await query(`
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
    `);

    // Progress Notes table
    await query(`
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
    `);

    // MRI Scans table
    await query(`
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
    `);

    // Forum Topics table
    await query(`
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
    `);

    // Forum Replies table
    await query(`
      CREATE TABLE IF NOT EXISTS forum_replies (
        id SERIAL PRIMARY KEY,
        author_id VARCHAR(255) REFERENCES users(id),
        author_name VARCHAR(255),
        content TEXT,
        role VARCHAR(50),
        timestamp TIMESTAMP,
        topic_id VARCHAR(255)
      );
    `);

    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating database tables:', err);
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
    // Sanitize filename and add timestamp
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedName}`);
  }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  // Chỉ cho phép file DICOM và một số định dạng ảnh y tế phổ biến
  const allowedMimeTypes = [
    'application/dicom',
    'image/dicom',
    'image/nii',
    'image/nii.gz',
    'image/x-nifti',
    'image/x-minc'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Không hỗ trợ định dạng file này. Chỉ chấp nhận file DICOM và NIfTI.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // Giới hạn 100MB
    files: 1 // Chỉ cho phép upload 1 file mỗi lần
  }
});

// Middleware xử lý lỗi upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File quá lớn. Kích thước tối đa là 100MB.' });
    }
    return res.status(400).json({ error: `Lỗi upload: ${error.message}` });
  }
  next(error);
};

// Hàm tạo số ngẫu nhiên an toàn trong khoảng [min, max]
const secureRandomNumber = (min, max) => {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValid = Math.floor((256 ** bytesNeeded) / range) * range - 1;

  let randomValue;
  do {
    randomValue = crypto.randomBytes(bytesNeeded).reduce((acc, byte, i) =>
      acc + (byte << (8 * i)), 0);
  } while (randomValue > maxValid);

  return min + (randomValue % range);
};

// Hàm tạo số thập phân ngẫu nhiên an toàn trong khoảng [min, max]
const secureRandomFloat = (min, max) => {
  const buffer = crypto.randomBytes(8);
  const randomValue = buffer.readDoubleLE() / Number.MAX_VALUE;
  return min + (randomValue * (max - min));
};

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

    // Tạo ID duy nhất sử dụng UUID v4 (cryptographically secure)
    const uid = uuidv4();

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
app.post('/api/mri/upload', upload.single('mriScan'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có tệp nào được tải lên' });
    }

    // Kiểm tra virus/malware (giả định có một service riêng)
    // await scanFile(req.file.path);

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

      // Mô phỏng phân tích với số ngẫu nhiên an toàn
      setTimeout(async () => {
        const diagnoses = ['AD', 'MCI', 'CN'];
        const diagnosis = diagnoses[secureRandomNumber(0, diagnoses.length - 1)];
        const mmseScore = secureRandomNumber(0, 30);
        const confidence = secureRandomFloat(0.5, 1.0);

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

// Migrate data from Firestore to PostgreSQL
const migrateData = async () => {
  try {
    // Migrate Users
    const usersSnapshot = await getDocs(collection(firestoreDb, 'users'));
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      await query(
        `INSERT INTO users (id, display_name, role, age, gender, doctor_id, email, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [doc.id, userData.displayName, userData.role, userData.age || null,
        userData.gender || null, userData.doctorId || null, userData.email || null,
        userData.createdAt || null]
      );
    }

    // Migrate Diagnostics
    const diagnosticsSnapshot = await getDocs(collection(firestoreDb, 'diagnostics'));
    for (const doc of diagnosticsSnapshot.docs) {
      const diagData = doc.data();
      await query(
        `INSERT INTO diagnostics (age, cd_rating, mmse_score, notes, patient_name, timestamp, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [diagData.age, diagData.cdRating, diagData.mmseScore, diagData.notes,
        diagData.patientName, diagData.timestamp.toDate(), diagData.userId]
      );
    }

    // Migrate Diagnosis Tests
    const diagnosisTestsSnapshot = await getDocs(collection(firestoreDb, 'diagnosisTests'));
    for (const doc of diagnosisTestsSnapshot.docs) {
      const testData = doc.data();
      await query(
        `INSERT INTO diagnosis_tests (attention_test, cd_rating, communication_test, doctor_email,
         doctor_notes, memory_test, mmse_score, orientation_test, patient_age, patient_name,
         recommendations, timestamp, user_id, visual_spatial_test)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [testData.attentionTest, testData.cdRating, testData.communicationTest,
        testData.doctorEmail, testData.doctorNotes, testData.memoryTest,
        testData.mmseScore, testData.orientationTest, testData.patientAge,
        testData.patientName, testData.recommendations, testData.timestamp.toDate(),
        testData.userId, testData.visualSpatialTest]
      );
    }

    // Migrate Progress Notes
    const progressNotesSnapshot = await getDocs(collection(firestoreDb, 'progressNotes'));
    for (const doc of progressNotesSnapshot.docs) {
      const noteData = doc.data();
      await query(
        `INSERT INTO progress_notes (created_by, notes, patient_age, patient_id,
         patient_name, status, timestamp, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [noteData.createdBy, noteData.notes, noteData.patientAge, noteData.patientId,
        noteData.patientName, noteData.status, noteData.timestamp.toDate(), noteData.userId]
      );
    }

    // Migrate MRI Scans
    const mriScansSnapshot = await getDocs(collection(firestoreDb, 'mriScans'));
    for (const doc of mriScansSnapshot.docs) {
      const scanData = doc.data();
      await query(
        `INSERT INTO mri_scans (ad_probability, age, cn_probability, confidence,
         diagnosis, file_name, file_size, gender, mmse_score, status, upload_date, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [scanData.adProbability, scanData.age, scanData.cnProbability, scanData.confidence,
        scanData.diagnosis, scanData.fileName, scanData.fileSize, scanData.gender,
        scanData.mmseScore, scanData.status, scanData.uploadDate.toDate(), scanData.userId]
      );
    }

    // Migrate Forum Topics
    const forumTopicsSnapshot = await getDocs(collection(firestoreDb, 'forumTopics'));
    for (const doc of forumTopicsSnapshot.docs) {
      const topicData = doc.data();
      await query(
        `INSERT INTO forum_topics (author_id, author_name, category, content,
         reply_count, role, timestamp, title)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [topicData.authorId, topicData.authorName, topicData.category, topicData.content,
        topicData.replyCount, topicData.role, topicData.timestamp.toDate(), topicData.title]
      );
    }

    // Migrate Forum Replies
    const forumRepliesSnapshot = await getDocs(collection(firestoreDb, 'forumReplies'));
    for (const doc of forumRepliesSnapshot.docs) {
      const replyData = doc.data();
      await query(
        `INSERT INTO forum_replies (author_id, author_name, content, role, timestamp, topic_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [replyData.authorId, replyData.authorName, replyData.content,
        replyData.role, replyData.timestamp.toDate(), replyData.topicId]
      );
    }

    console.log('Data migration completed successfully');
  } catch (err) {
    console.error('Error migrating data:', err);
    throw err;
  }
};

// Start the migration process
const startMigration = async () => {
  try {
    await initializeDatabase();
    await migrateData();
    console.log('Migration process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

startMigration();
