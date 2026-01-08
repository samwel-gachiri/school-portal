import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseConnection } from '../config/database';
import { config } from '../config/env';
import { User, UserSession } from '../types';

export class AuthService {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public async login(username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: Omit<User, 'password'>;
    message?: string;
  }> {
    try {
      // Find user by username
      const users = await this.db.query<User>(
        'SELECT user_id, username, password FROM user WHERE username = ?',
        [username]
      );
      
      if (users.length === 0) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      const user = users[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }

      // Generate JWT token
      const payload = { userId: user.user_id, username: user.username };
      const token = jwt.sign(payload, config.jwt.secret, { 
        expiresIn: config.jwt.expiresIn as any 
      });

      // Create session
      const sessionId = uuidv4();
      const expiresAt = new Date(Date.now() + config.session.timeout);

      await this.db.query(
        `INSERT INTO user_sessions (session_id, user_id, expires_at) 
         VALUES (?, ?, ?)`,
        [sessionId, user.user_id, expiresAt]
      );
      
      return {
        success: true,
        token,
        user: {
          user_id: user.user_id,
          username: user.username
        }
      };
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return {
        success: false,
        message: 'Login failed due to server error'
      };
    }
  }

  public async logout(sessionId: string): Promise<boolean> {
    try {
      await this.db.query(
        'UPDATE user_sessions SET is_active = FALSE WHERE session_id = ?',
        [sessionId]
      );
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  public async verifyToken(token: string): Promise<{
    valid: boolean;
    user?: Omit<User, 'password'>;
    message?: string;
  }> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Check if user still exists
      const users = await this.db.query<User>(
        'SELECT user_id, username FROM user WHERE user_id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        return {
          valid: false,
          message: 'User not found'
        };
      }

      return {
        valid: true,
        user: users[0]
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          message: 'Token expired'
        };
      }
      
      return {
        valid: false,
        message: 'Invalid token'
      };
    }
  }

  public async cleanupExpiredSessions(): Promise<void> {
    try {
      await this.db.query(
        'DELETE FROM user_sessions WHERE expires_at < NOW() OR is_active = FALSE'
      );
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  public async getUserSessions(userId: number): Promise<UserSession[]> {
    try {
      return await this.db.query<UserSession>(
        `SELECT session_id, user_id, created_at, expires_at, is_active 
         FROM user_sessions 
         WHERE user_id = ? AND is_active = TRUE AND expires_at > NOW()`,
        [userId]
      );
    } catch (error) {
      console.error('Get user sessions error:', error);
      return [];
    }
  }

  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
}