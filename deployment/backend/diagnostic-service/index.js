
const express = require('express');
const cors = require('cors');
const { query } = require('../../src/services/database');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Create diagnostic endpoint
app.post('/diagnostics', async (req, res) => {
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Get diagnostics by user ID
app.get('/diagnostics/user/:userId', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM diagnostics WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get diagnostics by patient name
app.get('/diagnostics/patient/:patientName', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM diagnostics WHERE patient_name = $1 ORDER BY created_at DESC',
      [req.params.patientName]
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all diagnostics
app.get('/diagnostics', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM diagnostics ORDER BY created_at DESC'
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting diagnostics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Diagnostic service running on port ${PORT}`);
});
