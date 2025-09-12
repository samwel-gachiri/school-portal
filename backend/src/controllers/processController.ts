import { Request, Response } from 'express';
import { AIService } from '../services/aiService';
import { AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

export class ProcessController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  public extractPaymentData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate request body
      const schema = Joi.object({
        imageBase64: Joi.string().required(),
        customInstructions: Joi.string().optional().allow(''),
        documentType: Joi.string().optional().allow('')
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

      const { imageBase64, customInstructions, documentType } = value;

      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const extractionResult = await this.aiService.extractPaymentData({
        imageBase64: base64Data,
        customInstructions,
        documentType
      });

      res.status(200).json({
        success: true,
        data: extractionResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Extract payment data error:', error);
      
      let errorMessage = 'Failed to extract payment data';
      let errorCode = 'EXTRACTION_FAILED';

      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error types
        if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
          errorCode = 'REQUEST_TIMEOUT';
          errorMessage = 'AI processing request timed out. Please try again.';
        } else if (error.message.includes('rate limit')) {
          errorCode = 'RATE_LIMIT_EXCEEDED';
        } else if (error.message.includes('quota')) {
          errorCode = 'QUOTA_EXCEEDED';
        } else if (error.message.includes('model_not_found') || error.message.includes('deprecated')) {
          errorCode = 'MODEL_ERROR';
          errorMessage = 'AI model is currently unavailable. Please contact support.';
        } else if (error.message.includes('Invalid JSON')) {
          errorCode = 'AI_RESPONSE_ERROR';
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public testAIConnection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const isConnected = await this.aiService.testConnection();
      
      res.status(200).json({
        success: true,
        data: {
          connected: isConnected,
          service: 'OpenAI Vision API',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AI connection test error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CONNECTION_TEST_FAILED',
          message: 'Failed to test AI service connection'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public getAIUsage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const usage = await this.aiService.getUsage();
      
      res.status(200).json({
        success: true,
        data: usage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get AI usage error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'USAGE_FETCH_FAILED',
          message: 'Failed to retrieve AI service usage'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public validateExtractedData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        extractedData: Joi.array().items(
          Joi.object({
            id: Joi.string().required(),
            amount: Joi.number().positive().required(),
            transactionRef: Joi.string().required(),
            studentName: Joi.string().required(),
            className: Joi.string().required(),
            confidence: Joi.number().min(0).max(1).required(),
            isEdited: Joi.boolean().required()
          })
        ).required()
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

      const { extractedData } = value;

      // Perform additional validation
      const validationResults = extractedData.map((payment: any, index: number) => {
        const issues: string[] = [];

        if (payment.amount <= 0) {
          issues.push('Amount must be positive');
        }

        if (!payment.transactionRef.trim()) {
          issues.push('Transaction reference is required');
        }

        if (!payment.studentName.trim()) {
          issues.push('Student name is required');
        }

        if (!payment.className.trim()) {
          issues.push('Class name is required');
        }

        if (payment.confidence < 0.3) {
          issues.push('Low confidence score - manual review recommended');
        }

        return {
          index,
          id: payment.id,
          valid: issues.length === 0,
          issues
        };
      });

      const validCount = validationResults.filter((r: { valid: boolean }) => r.valid).length;
      const invalidCount = validationResults.length - validCount;

      res.status(200).json({
        success: true,
        data: {
          totalRecords: extractedData.length,
          validRecords: validCount,
          invalidRecords: invalidCount,
          validationResults: validationResults.filter((r: { valid: boolean }) => !r.valid) // Only return invalid ones
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Validate extracted data error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Failed to validate extracted data'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}