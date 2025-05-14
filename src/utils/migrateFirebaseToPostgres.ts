
import { collection, getDocs } from 'firebase/firestore';
import { db as firebaseDb } from '../services/firebase';
import { dbService, query } from '../services/database';

// Function to initialize database tables
async function initializeDatabase() {
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
}

export async function migrateFirebaseToPostgres() {
  try {
    console.log('Starting migration from Firebase to PostgreSQL...');
    
    // Initialize PostgreSQL tables
    await initializeDatabase();
    
    // 1. Migrate users
    console.log('Migrating users...');
    const usersSnapshot = await getDocs(collection(firebaseDb, 'users'));
    const userPromises = usersSnapshot.docs.map(async (doc) => {
      const userData = doc.data();
      try {
        await dbService.users.createUser(
          doc.id,
          userData.email || '',
          userData.displayName || '',
          userData.role || 'patient',
          userData.doctorId || null
        );
        console.log(`Migrated user: ${doc.id}`);
      } catch (error) {
        console.error(`Error migrating user ${doc.id}:`, error);
      }
    });
    await Promise.all(userPromises);
    
    // 2. Migrate diagnostics
    console.log('Migrating diagnostics...');
    const diagnosticsSnapshot = await getDocs(collection(firebaseDb, 'diagnostics'));
    const diagnosticPromises = diagnosticsSnapshot.docs.map(async (doc) => {
      const diagnosticData = doc.data();
      try {
        await dbService.diagnostics.createDiagnostic({
          patientName: diagnosticData.patientName,
          age: diagnosticData.age,
          mmseScore: diagnosticData.mmseScore,
          cdRating: diagnosticData.cdRating,
          notes: diagnosticData.notes,
          userId: diagnosticData.userId
        });
        console.log(`Migrated diagnostic: ${doc.id}`);
      } catch (error) {
        console.error(`Error migrating diagnostic ${doc.id}:`, error);
      }
    });
    await Promise.all(diagnosticPromises);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
