import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { config } from '../config/env';

const execAsync = promisify(exec);

export class MigrationService {
  private liquibasePropertiesPath: string;

  constructor() {
    this.liquibasePropertiesPath = path.join(__dirname, '../../liquibase.properties');
  }

  /**
   * Run Liquibase migrations
   */
  public async runMigrations(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Running database migrations...');

      // Create a temporary properties file with resolved environment variables
      const tempPropsContent = `
changeLogFile=migrations/changelog-master.xml
url=jdbc:mysql://${config.db.host}:${config.db.port}/${config.db.name}?useSSL=true&requireSSL=true&serverTimezone=UTC
username=${config.db.user}
password=${config.db.password}
driver=com.mysql.cj.jdbc.Driver
classpath=lib/mysql-connector-java-8.0.33.jar
`.trim();

      // Run liquibase update command
      const command = `echo "${tempPropsContent}" | liquibase --defaults-file=/dev/stdin update`;
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: path.join(__dirname, '../..'),
        timeout: 60000 // 60 second timeout
      });

      if (stderr && !stderr.includes('WARNING')) {
        console.error('Liquibase stderr:', stderr);
      }

      console.log('✅ Database migrations completed successfully');
      if (stdout) {
        console.log('Migration output:', stdout);
      }

      return {
        success: true,
        message: 'Migrations completed successfully'
      };

    } catch (error: any) {
      console.error('❌ Migration failed:', error.message);
      
      // If liquibase command not found, provide helpful message
      if (error.message.includes('liquibase') && error.message.includes('not found')) {
        return {
          success: false,
          message: 'Liquibase not found. Please install Liquibase CLI or run migrations manually with: npm run migrate'
        };
      }

      return {
        success: false,
        message: `Migration failed: ${error.message}`
      };
    }
  }

  /**
   * Check if migrations are needed by looking at database structure
   */
  public async checkMigrationStatus(): Promise<{ needsMigration: boolean; missingTables: string[] }> {
    // This would typically query the DATABASECHANGELOG table that Liquibase creates
    // For now, we'll use the health service check as a proxy
    return {
      needsMigration: true, // We'll let the health service determine this
      missingTables: []
    };
  }

  /**
   * Alternative method using direct SQL execution for creating tables
   * This is a fallback if Liquibase is not available
   */
  public async runFallbackMigrations(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Running fallback database setup...');
      
      // Import database connection
      const { DatabaseConnection } = await import('../config/database');
      const db = DatabaseConnection.getInstance();

      // Create user table
      await db.query(`
        CREATE TABLE IF NOT EXISTS user (
          user_id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_username (username)
        )
      `);

      // Insert default admin user if not exists
      const existingUsers = await db.query('SELECT COUNT(*) as count FROM user WHERE username = ?', ['admin']);
      if (existingUsers[0]?.count === 0) {
        await db.query(
          'INSERT INTO user (username, password) VALUES (?, ?)',
          ['admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G']
        );
      }

      // Create user_sessions table
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          session_id VARCHAR(255) PRIMARY KEY,
          user_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          INDEX idx_user_sessions_user_id (user_id),
          INDEX idx_user_sessions_expires_at (expires_at),
          FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
        )
      `);

      // Create processing_log table
      await db.query(`
        CREATE TABLE IF NOT EXISTS processing_log (
          log_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          action_type ENUM('upload', 'extract', 'match', 'confirm', 'insert') NOT NULL,
          details JSON,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_processing_log_user_id (user_id),
          INDEX idx_processing_log_timestamp (timestamp),
          INDEX idx_processing_log_action_type (action_type),
          FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
        )
      `);

      // Create equity_transactions table (Equity Bank Integration)
      await db.query(`
        CREATE TABLE IF NOT EXISTS equity_transactions (
          transaction_id INT AUTO_INCREMENT PRIMARY KEY,
          transaction_ref VARCHAR(50) NOT NULL UNIQUE,
          transaction_date TIMESTAMP NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'KES' NOT NULL,
          depositor_name VARCHAR(255),
          depositor_mobile VARCHAR(20),
          payment_description VARCHAR(255),
          narration TEXT,
          status ENUM('pending', 'matched', 'posted', 'rejected') DEFAULT 'pending' NOT NULL,
          matched_student_adm INT,
          matched_by_user_id INT,
          matched_at TIMESTAMP NULL,
          posted_payment_id INT,
          rejection_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          INDEX idx_transaction_ref (transaction_ref),
          INDEX idx_depositor_mobile (depositor_mobile),
          INDEX idx_status (status),
          INDEX idx_transaction_date (transaction_date),
          INDEX idx_matched_student (matched_student_adm),
          FOREIGN KEY (matched_by_user_id) REFERENCES user(user_id) ON DELETE SET NULL
        )
      `);

      console.log('✅ Fallback database setup completed successfully');
      
      return {
        success: true,
        message: 'Database tables created successfully using fallback method'
      };

    } catch (error: any) {
      console.error('❌ Fallback migration failed:', error);
      return {
        success: false,
        message: `Fallback migration failed: ${error.message}`
      };
    }
  }
}
