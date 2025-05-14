
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { query } = require('../../src/services/database');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Configure file storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Upload MRI scan endpoint
app.post('/mri/upload', upload.single('mriScan'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { userId } = req.body;
    const id = uuidv4();
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    
    // Save MRI scan info to database
    await query(
      `INSERT INTO mri_scans (id, file_name, file_size, user_id, status) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, fileName, fileSize, userId, 'pending']
    );
    
    // Trigger processing (simulated)
    setTimeout(async () => {
      await query(
        `UPDATE mri_scans SET status = 'processed' WHERE id = $1`,
        [id]
      );
      
      // Simulate analysis (would be done by AI model in production)
      setTimeout(async () => {
        // Random diagnosis for demonstration
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
      message: 'MRI scan uploaded successfully',
      id,
      fileName,
      fileSize
    });
  } catch (error) {
    console.error('Error uploading MRI scan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get MRI scans by user ID
app.get('/mri/user/:userId', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM mri_scans WHERE user_id = $1 ORDER BY upload_date DESC',
      [req.params.userId]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting MRI scans:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get MRI scan by ID
app.get('/mri/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM mri_scans WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'MRI scan not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error getting MRI scan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`MRI service running on port ${PORT}`);
});
