import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') => {
  return new CustomError(message, statusCode, code);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // Log error details
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid input data';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  if (error.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    
    switch (error.message) {
      case 'File too large':
        message = 'File size exceeds maximum allowed limit';
        break;
      case 'Too many files':
        message = 'Too many files uploaded';
        break;
      default:
        message = 'File upload error';
    }
  }

  // Database errors
  if (error.message.includes('ECONNREFUSED')) {
    statusCode = 503;
    code = 'DATABASE_CONNECTION_ERROR';
    message = 'Database connection failed';
  }

  if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
    statusCode = 503;
    code = 'DATABASE_AUTH_ERROR';
    message = 'Database authentication failed';
  }

  if (error.message.includes('ER_BAD_DB_ERROR')) {
    statusCode = 503;
    code = 'DATABASE_NOT_FOUND';
    message = 'Database not found';
  }

  // OpenAI API errors
  if (error.message.includes('rate limit')) {
    statusCode = 429;
    code = 'AI_RATE_LIMIT';
    message = 'AI service rate limit exceeded. Please try again later.';
  }

  if (error.message.includes('insufficient_quota')) {
    statusCode = 402;
    code = 'AI_QUOTA_EXCEEDED';
    message = 'AI service quota exceeded. Please contact administrator.';
  }

  if (error.message.includes('invalid_api_key')) {
    statusCode = 401;
    code = 'AI_AUTH_ERROR';
    message = 'AI service authentication failed';
  }

  // Network errors
  if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
    statusCode = 503;
    code = 'NETWORK_ERROR';
    message = 'Network connection failed';
  }

  // File system errors
  if (error.message.includes('ENOENT')) {
    statusCode = 404;
    code = 'FILE_NOT_FOUND';
    message = 'File not found';
  }

  if (error.message.includes('EACCES')) {
    statusCode = 403;
    code = 'FILE_PERMISSION_ERROR';
    message = 'File permission denied';
  }

  // Don't expose internal errors in production
  if (config.server.nodeEnv === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(config.server.nodeEnv === 'development' && { 
        stack: error.stack,
        details: error 
      })
    },
    timestamp: new Date().toISOString()
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    },
    timestamp: new Date().toISOString()
  });
};

// Specific error creators
export const createValidationError = (message: string) => 
  new CustomError(message, 400, 'VALIDATION_ERROR');

export const createAuthError = (message: string = 'Authentication required') => 
  new CustomError(message, 401, 'UNAUTHORIZED');

export const createForbiddenError = (message: string = 'Access forbidden') => 
  new CustomError(message, 403, 'FORBIDDEN');

export const createNotFoundError = (message: string = 'Resource not found') => 
  new CustomError(message, 404, 'NOT_FOUND');

export const createConflictError = (message: string) => 
  new CustomError(message, 409, 'CONFLICT');

export const createRateLimitError = (message: string = 'Rate limit exceeded') => 
  new CustomError(message, 429, 'RATE_LIMIT_EXCEEDED');

export const createServiceUnavailableError = (message: string = 'Service temporarily unavailable') => 
  new CustomError(message, 503, 'SERVICE_UNAVAILABLE');