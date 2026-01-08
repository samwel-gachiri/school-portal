import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const schema = Joi.object({
        username: Joi.string().required().min(3).max(30),
        password: Joi.string().required().min(6)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.details[0].message
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { username, password } = value;
      
      const result = await this.authService.login(username, password);

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            token: result.token,
            user: result.user
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(401).json({
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: result.message || 'Login failed'
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login failed due to server error'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      
      if (sessionId) {
        await this.authService.logout(sessionId);
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Logout failed due to server error'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public verify = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // If we reach here, the auth middleware has already verified the token
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
          valid: true
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Verify controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Token verification failed due to server error'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public getSessions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const sessions = await this.authService.getUserSessions(req.user.user_id);
      
      res.status(200).json({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            session_id: session.session_id,
            created_at: session.created_at,
            expires_at: session.expires_at,
            is_active: session.is_active
          }))
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get sessions controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve sessions'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}