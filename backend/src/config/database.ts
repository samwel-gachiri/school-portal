import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { config } from './env';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: mysql.Pool;

  private constructor() {
    let sslConfig: any = undefined;
    
    if (config.db.sslCaPath) {
      try {
        const certPath = path.resolve(config.db.sslCaPath);
        if (fs.existsSync(certPath)) {
          sslConfig = {
            ca: fs.readFileSync(certPath)
          };
          console.log('SSL certificate loaded from:', certPath);
        } else {
          console.warn('SSL certificate file not found:', certPath);
          console.log('Attempting SSL connection without certificate file...');
          sslConfig = true; // Enable SSL but without specific CA
        }
      } catch (error) {
        console.error('Error loading SSL certificate:', error);
        console.log('Attempting SSL connection without certificate file...');
        sslConfig = true; // Enable SSL but without specific CA
      }
    }

    this.pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      ssl: sslConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPool(): mysql.Pool {
    return this.pool;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  public async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}