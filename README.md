# Bladder Royal Backend

A production-ready Node.js/Express backend server built with TypeScript, featuring authentication, user management, and real-time capabilities via Socket.IO.

## Features

- 🔐 **Authentication System**
  - Local authentication (login/signup)
  - Google OAuth integration
  - Secure session management with cookies
  - Password hashing with bcryptjs

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

## Google OAuth Setup

This backend supports Google OAuth authentication. To enable this feature, you need to create a Google Client ID and configure it. Here's how:

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Bladder Royal Backend")
5. Click "Create"

### Step 2: Enable Google+ API (if needed)

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity Services"
3. Click on it and click "Enable" (Note: Google+ API is deprecated, but the Google Identity Services is the modern replacement)

### Step 3: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in the required fields:
     - App name: Your app name
     - User support email: Your email
     - Developer contact email: Your email
   - Click "Save and Continue"
   - Add scopes (minimum: `email`, `profile`, `openid`)
   - Add test users if your app is in testing mode
   - Click "Save and Continue" through the remaining screens

### Step 4: Create OAuth Client ID

1. In "Credentials" page, click "Create Credentials" > "OAuth client ID"
2. Select application type:
   - For web backend: Choose "Web application"
   - For mobile apps: Choose the appropriate type
3. Configure the OAuth client:
   - **Name**: Give it a descriptive name (e.g., "Bladder Royal Backend")
   - **Authorized JavaScript origins**: Add your frontend URLs:
     - `http://localhost:3000` (for development)
     - `http://localhost:5173` (for Vite dev server)
     - Your production frontend URL (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**: Add your callback URLs:
     - For development: `http://localhost:3000/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
     - Note: These are typically handled by your frontend, not the backend
4. Click "Create"
5. **Copy the Client ID** - You'll see a popup with your Client ID (and Client Secret if applicable)
   - The Client ID looks like: `123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`

### Step 5: Configure Environment Variable

Add the Client ID to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
```

Replace `your_google_client_id_here` with the actual Client ID you copied in Step 4.

### Step 6: Frontend Configuration

Your frontend needs to:
1. Use the Google Identity Services library to obtain an ID token
2. Send the ID token to your backend's `/api/auth/google` endpoint
3. The backend will verify the token and create/authenticate the user

Example frontend setup (using Google Identity Services):
```javascript
// Load Google Identity Services
<script src="https://accounts.google.com/gsi/client" async defer></script>

// Initialize Google Sign-In
google.accounts.id.initialize({
  client_id: 'YOUR_GOOGLE_CLIENT_ID',
  callback: handleCredentialResponse
});

// Handle the ID token response
function handleCredentialResponse(response) {
  // Send the ID token to your backend
  fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: response.credential })
  })
  .then(res => res.json())
  .then(data => {
    // Handle successful authentication
  });
}
```

### Important Notes

- **Client Secret**: For web applications, Google doesn't provide a Client Secret for client-side apps. The backend uses the Client ID to verify the ID token.
- **Token Verification**: The backend verifies the ID token using the `google-auth-library` package, which automatically verifies the token's signature and audience.
- **Production**: Make sure to add your production URLs to the authorized origins and redirect URIs in the Google Cloud Console.
- **Testing**: If your app is in testing mode, only users added as test users can sign in. To make it public, you need to submit your app for verification (for sensitive scopes).

### Troubleshooting

- **"Google Client ID not configured"**: Make sure `GOOGLE_CLIENT_ID` is set in your `.env` file
- **"Invalid Google token"**: Verify that the Client ID matches between frontend and backend
- **CORS errors**: Ensure your frontend URL is added to authorized JavaScript origins
- **"Redirect URI mismatch"**: Verify the redirect URI in your frontend matches what's configured in Google Cloud Console

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
- **bcryptjs** - Password hashing
- **cookie-parser** - Cookie parsing middleware
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **google-auth-library** - Google OAuth integration

## License

ISC

## Author

Me
