# Bladder Royal Backend

A production-ready Node.js/Express backend server built with TypeScript, featuring authentication, user management, and real-time capabilities via Socket.IO.

## Features

- 🔐 **Authentication System**
  - Local authentication (login/signup)
  - Google OAuth integration
  - Secure session management with cookies
  - Password hashing with bcrypt

- 👥 **User Management**
  - User CRUD operations
  - Protected routes with authentication middleware

- 📍 **Area Marker API**
  - Create, read, update, and delete area markers
  - Protected endpoints requiring authentication

- 🔌 **Real-time Communication**
  - Socket.IO integration for real-time features

- 🛠️ **Developer Experience**
  - TypeScript for type safety
  - Hot reload with nodemon
  - Structured logging
  - Async Local Storage (ALS) for request context

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- MongoDB database (local or cloud instance)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bladder_royal_back
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=3030
NODE_ENV=development

# Database Configuration
MONGO_URL=your_mongodb_connection_string
DB_NAME=bladder_db

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:watch` - Start development server with file watching
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server (requires build first)
- `npm run prod` - Build and start production server (Windows)
- `npm run prod:mac` - Build and start production server (macOS/Linux)

## Project Structure

```
bladder_royal_back/
├── api/                    # API route handlers
│   ├── auth/              # Authentication endpoints
│   ├── user/              # User management endpoints
│   └── area marker/       # Area marker endpoints
├── config/                # Configuration files
│   ├── dev.ts            # Development configuration
│   ├── prod.ts           # Production configuration
│   └── index.ts          # Configuration loader
├── middlewares/           # Express middlewares
│   ├── logger.middleware.ts
│   ├── requireAuth.middleware.ts
│   └── setupAls.middleware.ts
├── services/              # Core services
│   ├── als.service.ts    # Async Local Storage service
│   ├── db.service.ts     # Database connection
│   ├── logger.service.ts # Logging service
│   └── socket.service.ts # Socket.IO service
├── types/                 # TypeScript type definitions
├── server.ts             # Application entry point
└── package.json          # Dependencies and scripts
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/google` - Google OAuth login

### User (`/api/user`)
- User management endpoints (see user routes for details)

### Area Marker (`/api/area-marker`)
- `GET /api/area-marker` - Get all area markers
- `GET /api/area-marker/:id` - Get area marker by ID
- `POST /api/area-marker` - Create area marker (requires auth)
- `PUT /api/area-marker/:id` - Update area marker (requires auth)
- `DELETE /api/area-marker/:id` - Delete area marker (requires auth)

## Development

### Running in Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3030` (or the port specified in your `.env` file).

### CORS Configuration

In development mode, the server allows requests from:
- `http://127.0.0.1:3000`
- `http://localhost:3000`
- `http://127.0.0.1:5173`
- `http://localhost:5173`

## Production

### Building for Production

```bash
npm run build
```

This compiles TypeScript files to the `dist/` directory.

### Running in Production

```bash
# macOS/Linux
npm run prod:mac

# Windows
npm run prod
```

Make sure to set `NODE_ENV=production` in your environment variables.

## Technologies Used

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - Database
- **Socket.IO** - Real-time communication
- **bcrypt** - Password hashing
- **cookie-parser** - Cookie parsing middleware
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **google-auth-library** - Google OAuth integration

## License

ISC

## Author

Me
