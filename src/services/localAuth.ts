
import bcrypt from 'bcryptjs';
import { dbService, query } from './database';

interface UserCredential {
  user: User;
}

interface User {
  uid: string;
  email: string;
  displayName: string;
}

// Local authentication service
export const localAuth = {
  // Current user state
  currentUser: null as User | null,
  
  // Create a new user with email and password
  async createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
      // Check if user already exists
      const existingUser = await dbService.users.getUserByEmail(email);
      if (existingUser) {
        throw new Error('Email already in use');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate unique ID
      const uid = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Create user in auth table
      await dbService.auth.createAuth(uid, email, hashedPassword);
      
      // Return user object
      const user = {
        uid,
        email,
        displayName: ''
      };
      
      this.currentUser = user;
      
      return { user };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  // Sign in with email and password
  async signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
      // Get user from auth table
      const authUser = await dbService.auth.getAuthByEmail(email);
      
      if (!authUser) {
        throw new Error('User not found');
      }
      
      // Compare password
      const passwordMatch = await bcrypt.compare(password, authUser.password);
      if (!passwordMatch) {
        throw new Error('Invalid password');
      }
      
      // Get user data
      const userData = await dbService.users.getUserById(authUser.id);
      
      // Create user object
      const user = {
        uid: authUser.id,
        email: authUser.email,
        displayName: userData.display_name || ''
      };
      
      this.currentUser = user;
      
      return { user };
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },
  
  // Sign out
  async signOut(): Promise<void> {
    this.currentUser = null;
  },
  
  // Update user profile
  async updateProfile(user: User, profile: { displayName?: string }): Promise<void> {
    try {
      if (profile.displayName) {
        await dbService.users.updateUser(user.uid, { displayName: profile.displayName });
        
        if (this.currentUser && this.currentUser.uid === user.uid) {
          this.currentUser.displayName = profile.displayName;
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  // On auth state changed
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // This is a simplified version for local auth
    // In a real implementation, you might use localStorage or a token-based system
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {};
  }
};

// Initialize auth table
export const initializeAuthDatabase = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS auth (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Auth database initialized successfully');
  } catch (err) {
    console.error('Error initializing auth database:', err);
    throw err;
  }
};
