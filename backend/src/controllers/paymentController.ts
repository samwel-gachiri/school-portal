import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  public validateBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        paymentRecords: Joi.array().items(
          Joi.object({
            extractedPayment: Joi.object({
              id: Joi.string().required(),
              amount: Joi.number().positive().required(),
              transactionRef: Joi.string().required(),
              studentName: Joi.string().required(),
              className: Joi.string().required(),
              confidence: Joi.number().min(0).max(1).required(),
              isEdited: Joi.boolean().required()
            }).required(),
            matchedStudent: Joi.object({
              adm: Joi.number().integer().positive().required(),
              name1: Joi.string().required(),
              name2: Joi.string().required(),
              name3: Joi.string().allow('', null),
              class: Joi.number().integer().required(),
              stream: Joi.number().integer().allow(null),
              currentBalance: Joi.number().required(),
              matchConfidence: Joi.number().min(0).max(1).required()
            }).allow(null),
            isMatched: Joi.boolean().required(),
            newBalance: Joi.number().min(0).required(),
            overpayment: Joi.number().min(0).default(0),
            status: Joi.string().valid('pending', 'confirmed', 'error').required()
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

      const { paymentRecords } = value;
      const validation = await this.paymentService.validateBatchPayments(paymentRecords);

      res.status(200).json({
        success: true,
        data: {
          batchValid: validation.valid,
          totalRecords: paymentRecords.length,
          validRecords: validation.validationResults.filter(r => r.valid).length,
          invalidRecords: validation.validationResults.filter(r => !r.valid).length,
          validationResults: validation.validationResults
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Validate batch error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to validate payment batch'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public processBatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const schema = Joi.object({
        paymentRecords: Joi.array().items(
          Joi.object({
            extractedPayment: Joi.object({
              id: Joi.string().required(),
              amount: Joi.number().positive().required(),
              transactionRef: Joi.string().required(),
              studentName: Joi.string().required(),
              className: Joi.string().required(),
              confidence: Joi.number().min(0).max(1).required(),
              isEdited: Joi.boolean().required()
            }).required(),
            matchedStudent: Joi.object({
              adm: Joi.number().integer().positive().required(),
              name1: Joi.string().required(),
              name2: Joi.string().required(),
              name3: Joi.string().allow('', null),
              class: Joi.number().integer().required(),
              stream: Joi.number().integer().allow(null),
              currentBalance: Joi.number().required(),
              matchConfidence: Joi.number().min(0).max(1).required()
            }).required(),
            isMatched: Joi.boolean().required(),
            newBalance: Joi.number().min(0).required(),
            overpayment: Joi.number().min(0).default(0),
            status: Joi.string().valid('pending', 'confirmed', 'error').required()
          })
        ).required(),
        confirmed: Joi.boolean().default(false)
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

      const { paymentRecords, confirmed } = value;

      if (!confirmed) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CONFIRMATION_REQUIRED',
            message: 'Payment batch must be confirmed before processing'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Filter out unmatched payments
      const matchedPayments = paymentRecords.filter((record: any) => 
        record.isMatched && record.matchedStudent
      );

      if (matchedPayments.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_MATCHED_PAYMENTS',
            message: 'No matched payments found to process'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.paymentService.processBatchPayments(
        matchedPayments,
        req.user.user_id
      );

      res.status(200).json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Process batch error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PROCESSING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to process payment batch'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0),
        userId: Joi.number().integer().positive().optional()
      });

      // Convert query string parameters to numbers with safe parsing
      const queryParams = {
        limit: req.query.limit ? (parseInt(req.query.limit as string, 10) || 50) : 50,
        offset: req.query.offset ? (parseInt(req.query.offset as string, 10) || 0) : 0,
        userId: req.query.userId ? parseInt(req.query.userId as string, 10) : undefined
      };

      // Additional validation to prevent NaN
      if (isNaN(queryParams.limit)) queryParams.limit = 50;
      if (isNaN(queryParams.offset)) queryParams.offset = 0;
      if (queryParams.userId !== undefined && isNaN(queryParams.userId)) {
        queryParams.userId = undefined;
      }

      console.log('Payment history query params:', queryParams);

      const { error, value } = schema.validate(queryParams);
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

      const { limit, offset, userId } = value;
      const history = await this.paymentService.getPaymentHistory(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: {
          payments: history,
          pagination: {
            limit,
            offset,
            count: history.length
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HISTORY_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve payment history'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public getStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional()
      });

      const { error, value } = schema.validate(req.query);
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

      const { startDate, endDate } = value;
      const statistics = await this.paymentService.getPaymentStatistics(
        startDate?.toISOString().split('T')[0],
        endDate?.toISOString().split('T')[0]
      );

      res.status(200).json({
        success: true,
        data: {
          statistics,
          period: {
            startDate: startDate?.toISOString().split('T')[0],
            endDate: endDate?.toISOString().split('T')[0]
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get payment statistics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATISTICS_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve payment statistics'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}