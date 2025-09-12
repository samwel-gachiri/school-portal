import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { DatabaseConnection } from './config/database';
import { HealthService } from './services/healthService';
import { MigrationService } from './services/migrationService';

// Import routes
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import processRoutes from './routes/process';
import studentRoutes from './routes/students';
import paymentRoutes from './routes/payments';

const app = express();
const healthService = new HealthService();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await healthService.checkHealth();
    const tableCheck = await healthService.checkDatabaseTables();
    
    res.status(health.status === 'healthy' ? 200 : 503).json({
      ...health,
      tables: tableCheck
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/process', processRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'School Fee Payment Portal API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);

  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload too large';
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: config.server.nodeEnv === 'production' ? 'Internal server error' : message
    },
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
async function startServer() {
  try {
    const db = DatabaseConnection.getInstance();
    const isConnected = await db.testConnection();
    
    if (!isConnected) {
      console.warn('⚠️ Database connection failed, but starting server anyway');
    } else {
      console.log('✅ Database connection established');
      
      // Check if migrations are needed
      const healthService = new HealthService();
      const tableCheck = await healthService.checkDatabaseTables();
      
      if (!tableCheck.tablesExist) {
        console.log('🔧 Missing database tables detected, running migrations...');
        console.log('Missing tables:', tableCheck.missingTables);
        
        const migrationService = new MigrationService();
        
        // Use fallback migration method directly (more reliable than Liquibase CLI)
        console.log('🔄 Running direct SQL migrations...');
        const migrationResult = await migrationService.runFallbackMigrations();
        
        if (migrationResult.success) {
          console.log('✅ Database migrations completed successfully');
        } else {
          console.error('❌ Migration failed:', migrationResult.message);
        }
      } else {
        console.log('✅ All required database tables exist');
      }
    }

    const server = app.listen(config.server.port, () => {
      console.log(`
🚀 School Fee Payment Portal API Server Started
📍 Environment: ${config.server.nodeEnv}
🌐 Port: ${config.server.port}
🔗 URL: http://localhost:${config.server.port}
📊 Health Check: http://localhost:${config.server.port}/health
      `);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.server.port} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();