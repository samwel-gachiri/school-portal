import { AuthService } from '../../services/authService';
import { DatabaseConnection } from '../../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockDb: jest.Mocked<any>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    };
    
    (DatabaseConnection.getInstance as jest.Mock).mockReturnValue(mockDb);
    authService = new AuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        password: 'hashedpassword'
      };

      mockDb.query.mockResolvedValueOnce([mockUser]);
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockJwt.sign.mockReturnValueOnce('mock-jwt-token');

      const result = await authService.login('testuser', 'password');

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual({
        user_id: 1,
        username: 'testuser'
      });
    });

    it('should fail login with invalid username', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await authService.login('invaliduser', 'password');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid username or password');
    });

    it('should fail login with invalid password', async () => {
      const mockUser = {
        user_id: 1,
        username: 'testuser',
        password: 'hashedpassword'
      };

      mockDb.query.mockResolvedValueOnce([mockUser]);
      mockBcrypt.compare.mockResolvedValueOnce(false);

      const result = await authService.login('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid username or password');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await authService.login('testuser', 'password');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Login failed due to server error');
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify valid token', async () => {
      const mockDecoded = { userId: 1, username: 'testuser' };
      const mockUser = { user_id: 1, username: 'testuser' };

      mockJwt.verify.mockReturnValueOnce(mockDecoded);
      mockDb.query.mockResolvedValueOnce([mockUser]);

      const result = await authService.verifyToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should fail verification for expired token', async () => {
      mockJwt.verify.mockImplementationOnce(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      const result = await authService.verifyToken('expired-token');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Token expired');
    });

    it('should fail verification for invalid token', async () => {
      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.verifyToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid token');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await authService.logout('session-id');

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE user_sessions SET is_active = FALSE WHERE session_id = ?',
        ['session-id']
      );
    });

    it('should handle logout errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await authService.logout('session-id');

      expect(result).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      mockBcrypt.hash.mockResolvedValueOnce('hashed-password');

      const result = await authService.hashPassword('password');

      expect(result).toBe('hashed-password');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password', 12);
    });
  });
});