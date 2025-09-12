import { AuthController } from '../../controllers/authController';
import { AuthService } from '../../services/authService';

// Mock AuthService
jest.mock('../../services/authService');

const MockAuthService = AuthService as jest.MockedClass<typeof AuthService>;

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockAuthService = {
      login: jest.fn(),
      logout: jest.fn(),
      verifyToken: jest.fn(),
    } as any;

    MockAuthService.mockImplementation(() => mockAuthService);
    authController = new AuthController();

    mockReq = createMockRequest();
    mockRes = createMockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };
      
      mockAuthService.login.mockResolvedValueOnce({
        success: true,
        token: 'jwt-token',
        user: { user_id: 1, username: 'testuser' }
      });

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          token: 'jwt-token',
          user: { user_id: 1, username: 'testuser' }
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for invalid input', async () => {
      mockReq.body = { username: 'ab', password: '123' }; // Too short

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('length must be at least')
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 401 for failed login', async () => {
      mockReq.body = { username: 'testuser', password: 'wrongpassword' };
      
      mockAuthService.login.mockResolvedValueOnce({
        success: false,
        message: 'Invalid username or password'
      });

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Invalid username or password'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle service errors gracefully', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };
      
      mockAuthService.login.mockRejectedValueOnce(new Error('Service error'));

      await authController.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Login failed due to server error'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      mockReq.headers = { 'x-session-id': 'session-123' };
      mockAuthService.logout.mockResolvedValueOnce(true);

      await authController.logout(mockReq, mockRes);

      expect(mockAuthService.logout).toHaveBeenCalledWith('session-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Logged out successfully'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle logout without session ID', async () => {
      mockReq.headers = {};

      await authController.logout(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    it('should return user data for valid token', async () => {
      mockReq.user = { user_id: 1, username: 'testuser' };

      await authController.verify(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: { user_id: 1, username: 'testuser' },
          valid: true
        },
        timestamp: expect.any(String)
      });
    });
  });
});