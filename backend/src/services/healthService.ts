import { DatabaseConnection } from '../config/database';

export class HealthService {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: boolean;
    timestamp: string;
    uptime: number;
  }> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    try {
      const databaseHealthy = await this.db.testConnection();
      
      return {
        status: databaseHealthy ? 'healthy' : 'unhealthy',
        database: databaseHealthy,
        timestamp,
        uptime
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        database: false,
        timestamp,
        uptime
      };
    }
  }

  public async checkDatabaseTables(): Promise<{
    tablesExist: boolean;
    missingTables: string[];
  }> {
    const requiredTables = [
      'user',
      'student', 
      'payment',
      'paycount',
      'charges',
      'class',
      'user_sessions',
      'processing_log',
      'equity_transactions'
    ];

    try {
      const existingTables = await this.db.query<{ TABLE_NAME: string }>(
        `SELECT TABLE_NAME 
         FROM information_schema.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_TYPE = 'BASE TABLE'`
      );

      const existingTableNames = existingTables.map(table => table.TABLE_NAME.toLowerCase());
      const missingTables = requiredTables.filter(
        table => !existingTableNames.includes(table.toLowerCase())
      );

      return {
        tablesExist: missingTables.length === 0,
        missingTables
      };
    } catch (error) {
      console.error('Database table check failed:', error);
      return {
        tablesExist: false,
        missingTables: requiredTables
      };
    }
  }
}