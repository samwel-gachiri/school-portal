import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the backend directory
// Use override: true to prioritize .env file over system environment variables
dotenv.config({ 
  path: path.join(__dirname, '../../.env'),
  override: true 
});

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'school_portal',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    sslCaPath: process.env.DB_SSL_CA_PATH,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT || '3600000', 10), // 1 hour
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'OPENAI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  if (config.server.nodeEnv === 'production') {
    process.exit(1);
  }
}