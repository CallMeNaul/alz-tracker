
# Backend Microservices

The backend is divided into three microservices:

## 1. Auth Service (port 3001)

Handles user authentication and registration.

Endpoints:
- POST `/register` - Register a new user
- POST `/login` - Authenticate a user
- GET `/health` - Health check endpoint

## 2. Diagnostic Service (port 3002)

Manages patient diagnostic information.

Endpoints:
- POST `/diagnostics` - Create a new diagnostic record
- GET `/diagnostics/user/:userId` - Get diagnostics by user ID
- GET `/diagnostics/patient/:patientName` - Get diagnostics by patient name
- GET `/diagnostics` - Get all diagnostics
- GET `/health` - Health check endpoint

## 3. MRI Service (port 3003)

Handles MRI scan uploads, processing and analysis.

Endpoints:
- POST `/mri/upload` - Upload a new MRI scan
- GET `/mri/user/:userId` - Get MRI scans by user ID
- GET `/mri/:id` - Get MRI scan by ID
- GET `/health` - Health check endpoint
