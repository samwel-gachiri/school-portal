import { config } from '../config/env';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock database connection
jest.mock('../config/database', () => ({
  DatabaseConnection: {
    getInstance: jest.fn(() => ({
      testConnection: jest.fn().mockResolvedValue(true),
      query: jest.fn(),
      transaction: jest.fn(),
      close: jest.fn(),
    })),
  },
}));

// Mock OpenAI
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    models: {
      list: jest.fn().mockResolvedValue({ data: [{ id: 'gpt-4-vision-preview' }] }),
    },
  })),
}));

// Mock file system operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
  access: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
}));

// Global test utilities
(global as any).createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { user_id: 1, username: 'testuser' },
  ...overrides,
});

(global as any).createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

(global as any).createMockNext = () => jest.fn();