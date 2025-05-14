
// Database configuration for PostgreSQL
import { Pool } from 'pg';

// Configuration for local development and production
const config = {
  development: {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'alzheimer_diagnosing',
    ssl: false
/*  },
  production: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }*/
  }
};

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? config.production : config.development;

// Create a new pool instance
const pool = new Pool(dbConfig);

// Export the query function
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

// Database service functions
export const dbService = {
  // User-related functions
  users: {
    // Create a new user
    async createUser(userId: string, email: string, displayName: string, role: string, doctorId?: string) {
      const result = await query(
        `INSERT INTO users (id, email, display_name, role, doctor_id) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userId, email, displayName, role, doctorId || null]
      );
      return result.rows[0];
    },

    // Get user by ID
    async getUserById(userId: string) {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0];
    },

    // Get user by email
    async getUserByEmail(email: string) {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    },

    // Update user profile
    async updateUser(userId: string, data: any) {
      const { displayName, role, doctorId } = data;
      const result = await query(
        `UPDATE users 
         SET display_name = $2, role = $3, doctor_id = $4
         WHERE id = $1 
         RETURNING *`,
        [userId, displayName, role, doctorId || null]
      );
      return result.rows[0];
    }
  },

  // Authentication functions
  auth: {
    // Create a new auth record
    async createAuth(userId: string, email: string, password: string) {
      const result = await query(
        `INSERT INTO auth (id, email, password) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [userId, email, password]
      );
      return result.rows[0];
    },

    // Get auth by email
    async getAuthByEmail(email: string) {
      const result = await query(
        'SELECT * FROM auth WHERE email = $1',
        [email]
      );
      return result.rows[0];
    }
  },

  // Diagnostics-related functions
  diagnostics: {
    // Create a new diagnostic record
    async createDiagnostic(data: any) {
      const { patientName, age, mmseScore, cdRating, notes, userId } = data;
      const result = await query(
        `INSERT INTO diagnostics (patient_name, age, mmse_score, cd_rating, notes, user_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [patientName, age, mmseScore, cdRating, notes, userId]
      );
      return result.rows[0];
    },

    // Get diagnostics by user ID
    async getDiagnosticsByUserId(userId: string) {
      const result = await query(
        'SELECT * FROM diagnostics WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    },
    
    // Get diagnostics by patient name
    async getDiagnosticsByPatientName(patientName: string) {
      const result = await query(
        'SELECT * FROM diagnostics WHERE patient_name = $1 ORDER BY created_at DESC',
        [patientName]
      );
      return result.rows;
    },
    
    // Get all diagnostics
    async getAllDiagnostics() {
      const result = await query(
        'SELECT * FROM diagnostics ORDER BY created_at DESC'
      );
      return result.rows;
    },
  },

  // MRI scans-related functions
  mriScans: {
    // Create a new MRI scan record
    async createMriScan(id: string, fileName: string, fileSize: number, userId: string) {
      const result = await query(
        `INSERT INTO mri_scans (id, file_name, file_size, user_id, status) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [id, fileName, fileSize, userId, 'pending']
      );
      return result.rows[0];
    },

    // Update MRI scan status
    async updateMriScanStatus(id: string, status: string) {
      const result = await query(
        `UPDATE mri_scans 
         SET status = $2 
         WHERE id = $1 
         RETURNING *`,
        [id, status]
      );
      return result.rows[0];
    },

    // Update MRI scan analysis results
    async updateMriScanResults(id: string, diagnosis: string, mmseScore: number, confidence: number) {
      const result = await query(
        `UPDATE mri_scans 
         SET status = 'analyzed', diagnosis = $2, mmse_score = $3, confidence = $4 
         WHERE id = $1 
         RETURNING *`,
        [id, diagnosis, mmseScore, confidence]
      );
      return result.rows[0];
    },

    // Get MRI scans by user ID
    async getMriScansByUserId(userId: string) {
      const result = await query(
        'SELECT * FROM mri_scans WHERE user_id = $1 ORDER BY upload_date DESC',
        [userId]
      );
      return result.rows;
    },

    // Get MRI scan by ID
    async getMriScanById(id: string) {
      const result = await query(
        'SELECT * FROM mri_scans WHERE id = $1',
        [id]
      );
      return result.rows[0];
    }
  }
};
