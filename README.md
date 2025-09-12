# School Fee Payment Portal

An AI-powered web application for processing student fee payments through image analysis and automated data extraction.

## Features

- 🤖 AI-powered bank statement image analysis
- 📊 Editable data extraction tables
- 🔍 Automatic student matching with fuzzy search
- 💳 Secure payment processing
- 📋 Comprehensive audit logging
- 🔐 JWT-based authentication

## Technology Stack

### Frontend

- Vue.js 3 with TypeScript
- Tailwind CSS for styling
- Pinia for state management
- Vue Router for navigation

### Backend

- Node.js with Express.js
- TypeScript
- MySQL with SSL connection
- OpenAI Vision API integration
- Liquibase for database migrations

## Project Structure

```
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # API route controllers
│   │   ├── services/        # Business logic services
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── migrations/          # Liquibase database migrations
│   └── package.json
├── frontend/                # Vue.js frontend application
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── views/           # Page components
│   │   ├── stores/          # Pinia stores
│   │   ├── router/          # Vue Router configuration
│   │   ├── services/        # API service functions
│   │   └── types/           # TypeScript type definitions
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL database (Aiven hosted)
- OpenAI API key

### Backend Setup

1. Navigate to backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Copy environment file: `cp .env.example .env`
4. Configure your database and API keys in `.env`
5. Run database migrations: `npm run migrate`
6. Start development server: `npm run dev`

### Frontend Setup

1. Navigate to frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

### Environment Variables

#### Backend (.env)

```
PORT=3000
NODE_ENV=development
DB_HOST=your-aiven-host.aivencloud.com
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL_CA_PATH=./certs/ca-certificate.crt
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
```

## Development

### Running Tests

- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`

### Building for Production

- Backend: `cd backend && npm run build`
- Frontend: `cd frontend && npm run build`

## API Documentation

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### File Processing

- `POST /api/upload/image` - Upload bank statement image
- `POST /api/process/extract` - Extract payment data with AI
- `POST /api/process/match-students` - Match students to payments

### Database Operations

- `GET /api/students/search` - Search for students
- `POST /api/payments/batch-insert` - Insert payment batch
- `GET /api/payments/history` - Get payment history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
