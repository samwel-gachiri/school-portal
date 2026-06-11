import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    username: string;
  };
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "No valid authorization token provided",
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const verification = await this.authService.verifyToken(token);

      if (!verification.valid) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: verification.message || "Invalid token",
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      req.user = verification.user;
      next();
    } catch (error) {
      console.error("Authentication middleware error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Authentication failed due to server error",
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  public optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const verification = await this.authService.verifyToken(token);

        if (verification.valid) {
          req.user = verification.user;
        }
      }

      next();
    } catch (error) {
      console.error("Optional authentication middleware error:", error);
      next(); // Continue without authentication
    }
  };

  public requireRole = (roles: string[]) => {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // For now, we'll implement basic role checking
      // This can be extended when role system is implemented
      next();
    };
  };
}

// Export a singleton instance for use as middleware
const authMiddleware = new AuthMiddleware();
export const requireAuth = authMiddleware.authenticate;
export const optionalAuth = authMiddleware.optionalAuth;
