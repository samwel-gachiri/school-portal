import { AIService } from '../../services/aiService';
import OpenAI from 'openai';

// Mock OpenAI
const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAIInstance: jest.Mocked<OpenAI>;

  beforeEach(() => {
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
      models: {
        list: jest.fn(),
      },
    } as any;

    mockOpenAI.mockImplementation(() => mockOpenAIInstance);
    aiService = new AIService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('extractPaymentData', () => {
    it('should successfully extract payment data from image', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify([
              {
                amount: 5000,
                transactionRef: 'TXN123456',
                studentName: 'John Doe',
                className: 'Grade 5',
                confidence: 0.9
              }
            ])
          }
        }]
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockResponse as any);

      const result = await aiService.extractPaymentData({
        imageBase64: 'base64-image-data',
        customInstructions: 'Extract payment data'
      });

      expect(result.extractedData).toHaveLength(1);
      expect(result.extractedData[0]).toMatchObject({
        amount: 5000,
        transactionRef: 'TXN123456',
        studentName: 'John Doe',
        className: 'Grade 5',
        confidence: 0.9
      });
      expect(result.confidence).toBe(0.9);
    });

    it('should handle invalid JSON response from AI', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockResponse as any);

      await expect(aiService.extractPaymentData({
        imageBase64: 'base64-image-data'
      })).rejects.toThrow('Invalid JSON response from AI service');
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('rate limit exceeded');
      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(rateLimitError);

      await expect(aiService.extractPaymentData({
        imageBase64: 'base64-image-data'
      })).rejects.toThrow('AI service rate limit exceeded. Please try again later.');
    });

    it('should handle quota exceeded errors', async () => {
      const quotaError = new Error('insufficient_quota');
      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(quotaError);

      await expect(aiService.extractPaymentData({
        imageBase64: 'base64-image-data'
      })).rejects.toThrow('AI service quota exceeded. Please contact administrator.');
    });

    it('should parse amounts correctly', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify([
              {
                amount: 'KSh 5,000.50',
                transactionRef: 'TXN123',
                studentName: 'Jane Doe',
                className: 'G.3',
                confidence: 0.8
              }
            ])
          }
        }]
      };

      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockResponse as any);

      const result = await aiService.extractPaymentData({
        imageBase64: 'base64-image-data'
      });

      expect(result.extractedData[0].amount).toBe(5000.50);
      expect(result.extractedData[0].className).toBe('Grade 3');
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockOpenAIInstance.models.list.mockResolvedValueOnce({
        data: [{ id: 'gpt-4-vision-preview' }]
      } as any);

      const result = await aiService.testConnection();

      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      mockOpenAIInstance.models.list.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await aiService.testConnection();

      expect(result).toBe(false);
    });
  });
});