import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env";
import { DatabaseConnection } from "./config/database";
import { HealthService } from "./services/healthService";
import { MigrationService } from "./services/migrationService";
import { AuthService } from "./services/authService";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandler";
import { stream } from "./utils/logger";

// Import routes
import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/upload";
import processRoutes from "./routes/process";
import studentRoutes from "./routes/students";
import paymentRoutes from "./routes/payments";
import manualFeesRoutes from "./routes/manualFees";
import receiptsRoutes from "./routes/receipts";
import equityRoutes from "./routes/equity";

class Server {
  private app: express.Application;
  private healthService: HealthService;
  private authService: AuthService;

  constructor() {
    this.app = express();
    this.healthService = new HealthService();
    this.authService = new AuthService();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin:
          config.server.nodeEnv === "production"
            ? [
                "https://school-portal-self.vercel.app", // Replace with your Vercel domain
                "https://school-portal-aghs.vercel.app"
              ]
            : ["http://localhost:5173", "http://127.0.0.1:5173"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
      })
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }));

    // Request logging middleware
    this.app.use(morgan("combined", { stream }));
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get("/health", async (req, res) => {
      try {
        const health = await this.healthService.checkHealth();
        const tableCheck = await this.healthService.checkDatabaseTables();

        res.status(health.status === "healthy" ? 200 : 503).json({
          ...health,
          tables: tableCheck,
        });
      } catch (error) {
        res.status(503).json({
          status: "unhealthy",
          error: "Health check failed",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // API routes
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/upload", uploadRoutes);
    this.app.use("/api/process", processRoutes);
    this.app.use("/api/students", studentRoutes);
    this.app.use("/api/payments", paymentRoutes);
    this.app.use("/api/manual-fees", manualFeesRoutes);
    this.app.use("/api/receipts", receiptsRoutes);
    this.app.use("/api/equity", equityRoutes);

    console.log("✅ Manual fees routes registered at /api/manual-fees");
    console.log("✅ Receipts routes registered at /api/receipts");
    console.log("✅ Equity integration routes registered at /api/equity");

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        message: "School Fee Payment Portal API",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use("*", notFoundHandler);
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(globalErrorHandler);
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const db = DatabaseConnection.getInstance();
      const isConnected = await db.testConnection();

      if (!isConnected) {
        throw new Error("Failed to connect to database");
      }

      console.log("✅ Database connection established");

      // Check required tables and auto-run migrations if needed
      const tableCheck = await this.healthService.checkDatabaseTables();
      if (!tableCheck.tablesExist) {
        console.log("🔧 Missing database tables detected, running migrations...");
        console.log("Missing tables:", tableCheck.missingTables);
        
        const migrationService = new MigrationService();
        
        // Use fallback migration method directly (more reliable than Liquibase CLI)
        console.log("🔄 Running direct SQL migrations...");
        const migrationResult = await migrationService.runFallbackMigrations();
        
        if (migrationResult.success) {
          console.log("✅ Database migrations completed successfully");
        } else {
          console.error("❌ Migration failed:", migrationResult.message);
          if (config.server.nodeEnv === "production") {
            throw new Error("Database migration failed");
          }
        }
      } else {
        console.log("✅ All required database tables exist");
      }
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      if (config.server.nodeEnv === "production") {
        process.exit(1);
      }
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      try {
        // Close database connections
        const db = DatabaseConnection.getInstance();
        await db.close();
        console.log("✅ Database connections closed");

        // Cleanup expired sessions
        await this.authService.cleanupExpiredSessions();
        console.log("✅ Session cleanup completed");

        console.log("✅ Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await this.initializeDatabase();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start server
      const server = this.app.listen(config.server.port, () => {
        console.log(`
🚀 School Fee Payment Portal API Server Started
📍 Environment: ${config.server.nodeEnv}
🌐 Port: ${config.server.port}
🔗 URL: http://localhost:${config.server.port}
📊 Health Check: http://localhost:${config.server.port}/health
        `);
      });

      // Handle server errors
      server.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
          console.error(`❌ Port ${config.server.port} is already in use`);
        } else {
          console.error("❌ Server error:", error);
        }
        process.exit(1);
      });

      // Setup periodic cleanup tasks
      setInterval(async () => {
        try {
          await this.authService.cleanupExpiredSessions();
        } catch (error) {
          console.error("Periodic cleanup error:", error);
        }
      }, 60 * 60 * 1000); // Run every hour
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new Server();
server.start().catch((error) => {
  console.error("❌ Server startup failed:", error);
  process.exit(1);
});
