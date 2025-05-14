
# Welcome to my Graduation Thesis Project

## Project info

**URL**: https://lovable.dev/projects/4989326e-e756-4986-9ac0-39248cb7137e

## How can I edit this code?

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Local Deployment Guide

### Setting up PostgreSQL Database Locally

1. **Install PostgreSQL:**
   - Windows: Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)
   - macOS: Use Homebrew: `brew install postgresql`
   - Linux (Ubuntu/Debian): `sudo apt update && sudo apt install postgresql postgresql-contrib`

2. **Start PostgreSQL service:**
   - Windows: PostgreSQL is installed as a service and should start automatically
   - macOS: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

3. **Create a database:**
   ```sh
   # Login to PostgreSQL
   sudo -u postgres psql
   
   # Create the database
   CREATE DATABASE alzheimer_diagnosing;
   
   # Create a user (optional - you can use the default postgres user)
   CREATE USER myuser WITH ENCRYPTED PASSWORD 'mypassword';
   
   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE alzheimer_diagnosing TO myuser;
   
   # Exit psql
   \q
   ```

4. **Configure database connection:**
   - Update the database configuration in the `src/services/database.ts` file if needed. 
   - Default configuration:
     ```
     user: 'postgres',
     password: 'postgres',
     host: 'localhost',
     port: 5432,
     database: 'alzheimer_diagnosing'
     ```

### Setting up the Application

1. **Clone the repository:**
   ```sh
   git clone <YOUR_REPOSITORY_URL>
   cd <YOUR_PROJECT_DIRECTORY>
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Initialize the database:**
   - The application will automatically initialize the required database tables when it starts.
   - To manually initialize or reset the database, you can create a script:
   ```sh
   # Create a file named init-db.js
   const { initializeDatabase } = require('./src/services/database');
   
   initializeDatabase()
     .then(() => console.log('Database initialized successfully'))
     .catch(err => console.error('Error initializing database:', err))
     .finally(() => process.exit());
   ```

4. **Start the application:**
   ```sh
   npm run dev
   ```

5. **Access the application:**
   - Open your browser and navigate to: `http://localhost:8080`

### Migrating from Firebase to PostgreSQL

If you have existing data in Firebase that you want to migrate to your local PostgreSQL database:

1. **Export your Firebase data:**
   - Go to Firebase Console > Your Project > Database > Export Data

2. **Run the migration script:**
   ```sh
   # Ensure your Firebase config is properly set up in src/services/firebase.ts
   node src/utils/migrateFirebaseToPostgres.ts
   ```

### Troubleshooting

- **Database connection issues:**
  - Check if PostgreSQL service is running
  - Verify database credentials in `src/services/database.ts`
  - Ensure your firewall allows connections to PostgreSQL port (default: 5432)

- **Authentication problems:**
  - The local authentication system uses bcrypt for password hashing
  - Ensure the auth tables are properly initialized

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- PostgreSQL for database
- bcryptjs for password hashing

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4989326e-e756-4986-9ac0-39248cb7137e) and click on Share -> Publish.

For production deployment with a PostgreSQL database:
1. Set up a PostgreSQL database on your hosting provider
2. Configure the database connection in `src/services/database.ts`
3. Set the `NODE_ENV` environment variable to `production`
4. Deploy your application

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
