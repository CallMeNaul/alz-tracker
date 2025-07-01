
# Welcome to my Graduation Thesis Project

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Node.js and Express.js
- PostgreSQL for database
- bcryptjs for password hashing

## Local Deployment Guide

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

The database consists of the following main tables:

1. **auth**: Stores user authentication information
2. **users**: Stores user profile information
3. **diagnostics**: Stores patient diagnostic information
4. **mri_scans**: Stores uploaded MRI image information

Follow these steps:

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
   git clone https://github.com/CallMeNaul/alz-tracker.git
   cd alz-tracker
   cp env-example .env
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

## Docker Deployment Guide

### System Requirements
1. Install [Docker](https://docs.docker.com/get-docker/)
2. Install [Docker Compose](https://docs.docker.com/compose/install/)

### System Structure

1. **postgres**: PostgreSQL database
2. **app**: React frontend
3. **diagnosing-server**: Python Server for MRI image diagnosis and demographic information
4. **backend**: Node.js application running Express.js

### 1. Clone repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Build and launch services

```bash
docker-compose up -d
```

### 3. Access the application

Open your web browser and go to:

```
http://localhost:8080
```

### View logs

```bash
# View logs of all services
docker-compose logs

# Monitor logs in real time
docker-compose logs -f
```

### Stop services

```bash
# Stop all services
docker-compose down

# Stop and remove all services (volumes)
docker-compose down -v
docker system prune -a
```

### Restart services

```bash
docker-compose restart
```

### Troubleshooting

- **Database connection issues:**
  - Check if PostgreSQL service is running
  - Verify database credentials in `src/services/database.ts`
  - Ensure your firewall allows connections to PostgreSQL port (default: 5432)

```bash
# View postgres logs 
docker-compose logs postgres

# Make sure ports are not conflicting
sudo lsof -i :5432

# View front-end logs
docker-compose logs app

# Check network information
docker network inspect alzheimer-network
```

- **Authentication problems:**
  - The local authentication system uses bcrypt for password hashing
  - Ensure the auth tables are properly initialized