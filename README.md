# Authentication App

A full-stack authentication application with React + Vite frontend, Node.js + Express backend, and PostgreSQL database.

## Features

- User registration (signup)
- User login
- JWT-based authentication
- Protected dashboard route
- Clean and modern UI
- Password hashing with bcrypt
- Secure token-based sessions

## Project Structure

```
authentication/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components (Login, Signup, Dashboard)
│   │   ├── utils/          # API utilities
│   │   ├── App.jsx         # Main app component with routing
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── server/                 # Node.js + Express backend
    ├── src/
    │   ├── config/         # Database configuration
    │   ├── controllers/    # Request handlers
    │   ├── middleware/     # Auth middleware
    │   ├── models/         # Database models
    │   ├── routes/         # API routes
    │   └── server.js       # Entry point
    ├── .env.example
    └── package.json
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup Instructions

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:** Download from [postgresql.org](https://www.postgresql.org/download/)

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Login to PostgreSQL
psql postgres

# Create database
CREATE DATABASE auth_db;

# Exit
\q
```

### 3. Configure Server

```bash
cd server

# Copy environment file
cp .env.example .env

# Edit .env and update your database credentials
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/auth_db
# JWT_SECRET=your-random-secret-key-here

# Install dependencies
npm install
```

### 4. Configure Client

```bash
cd ../client

# Install dependencies
npm install
```

## Running the Application

### Start Backend Server

```bash
cd server
npm run dev
'''

Server runs on: `http://localhost:3001`

### Start Frontend

Open a new terminal:

```bash
cd client
npm run dev
```

Frontend runs on: `http://localhost:3000`

## API Endpoints

### Authentication Routes

- `POST /api/auth/signup` - Register new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `GET /api/auth/profile` - Get user profile (requires JWT token)
  - Headers: `Authorization: Bearer <token>`

- `GET /api/health` - Health check endpoint

## Security Features

- Passwords hashed using bcrypt (10 salt rounds)
- JWT tokens for stateless authentication --> stateless 
- Token expiration (7 days)
- Protected routes with middleware
- Input validation
- SQL injection prevention with parameterized queries
- CORS enabled for cross-origin requests

## Technologies Used

### Frontend
- React 18
- Vite
- React Router DOM
- Fetch API

### Backend
- Node.js
- Express
- PostgreSQL
- JWT (jsonwebtoken)
- bcryptjs
- CORS
- dotenv

## Development

The server uses Node's `--watch` flag for auto-restart on file changes. Vite provides HMR (Hot Module Replacement) for the frontend.

## Production Deployment

1. Update environment variables for production
2. Build frontend: `cd client && npm run build`
3. Use a process manager like PM2 for the server
4. Use a reverse proxy like Nginx
5. Enable HTTPS with SSL certificates
6. Use environment-specific database

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `psql postgres`
- Check DATABASE_URL in `.env`
- Ensure database `auth_db` exists

### Port Conflicts
- Backend: Change PORT in `server/.env`
- Frontend: Change port in `client/vite.config.js`

### CORS Errors
- Ensure backend CORS is configured correctly
- Check proxy settings in `client/vite.config.js`

## License

MIT
