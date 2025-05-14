
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { query } = require('../../src/services/database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Register endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, role, doctorId } = req.body;
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM auth WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate unique ID
    const uid = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create user in auth table
    await query(
      `INSERT INTO auth (id, email, password) VALUES ($1, $2, $3)`,
      [uid, email, hashedPassword]
    );
    
    // Create user in users table
    await query(
      `INSERT INTO users (id, email, display_name, role, doctor_id) VALUES ($1, $2, $3, $4, $5)`,
      [uid, email, displayName, role, doctorId || null]
    );
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: { uid, email, displayName, role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from auth table
    const authResult = await query(
      'SELECT * FROM auth WHERE email = $1',
      [email]
    );
    
    const authUser = authResult.rows[0];
    if (!authUser) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Compare password
    const passwordMatch = await bcrypt.compare(password, authUser.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Get user data
    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [authUser.id]
    );
    
    const userData = userResult.rows[0];
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        uid: authUser.id,
        email: authUser.email,
        displayName: userData.display_name,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
