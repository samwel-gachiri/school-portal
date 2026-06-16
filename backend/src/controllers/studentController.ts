import { Request, Response } from 'express';
import { StudentService } from '../services/studentService';
import { AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

export class StudentController {
  private studentService: StudentService;

  constructor() {
    this.studentService = new StudentService();
  }

  public searchStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        query: Joi.string().required().min(1),
        searchType: Joi.string().valid('name', 'admission', 'class', 'all').default('all'),
        limit: Joi.number().integer().min(1).max(100).default(50)
      });

      // Convert query string parameters to proper types
      const queryParams = {
        query: req.query.query as string,
        searchType: req.query.searchType as string || 'all',
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50
      };

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

      const { query, searchType, limit } = value;
      const result = await this.studentService.searchStudents(query, searchType, limit);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Search students error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to search students'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public matchStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        payments: Joi.array().items(
          Joi.object({
            id: Joi.string().required(),
            studentName: Joi.string().required(),
            className: Joi.string().required(),
            amount: Joi.number().positive().required(),
            transactionRef: Joi.string().required()
          })
        ).required(),
        matchThreshold: Joi.number().min(0).max(1).default(0.5)
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

      const { payments, matchThreshold } = value;
      const matchResults = [];

      for (const payment of payments) {
        try {
          const matches = await this.studentService.findStudentMatches(
            payment.studentName,
            payment.className,
            5 // Limit to top 5 matches per payment
          );

          const filteredMatches = matches.filter(match => match.matchScore >= matchThreshold);

          matchResults.push({
            paymentId: payment.id,
            studentName: payment.studentName,
            className: payment.className,
            amount: payment.amount,
            transactionRef: payment.transactionRef,
            matches: filteredMatches,
            hasMatches: filteredMatches.length > 0,
            bestMatch: filteredMatches.length > 0 ? filteredMatches[0] : null
          });

        } catch (matchError) {
          matchResults.push({
            paymentId: payment.id,
            studentName: payment.studentName,
            className: payment.className,
            amount: payment.amount,
            transactionRef: payment.transactionRef,
            matches: [],
            hasMatches: false,
            bestMatch: null,
            error: 'Failed to find matches for this payment'
          });
        }
      }

      const summary = {
        totalPayments: payments.length,
        matchedPayments: matchResults.filter(r => r.hasMatches).length,
        unmatchedPayments: matchResults.filter(r => !r.hasMatches).length,
        matchThreshold
      };

      res.status(200).json({
        success: true,
        data: {
          summary,
          results: matchResults
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Match students error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MATCHING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to match students'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public getStudentDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        admissionNumber: Joi.number().integer().positive().required()
      });

      const { error, value } = schema.validate(req.params);
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

      const { admissionNumber } = value;
      
      const student = await this.studentService.getStudentById(admissionNumber);
      if (!student) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: `Student with admission number ${admissionNumber} not found`
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const feeStructure = await this.studentService.getStudentFeeStructure(admissionNumber);
      const transactions = await this.studentService.getStudentTransactions(admissionNumber);

      res.status(200).json({
        success: true,
        data: {
          student,
          feeStructure,
          transactions
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get student details error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to retrieve student details'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public manualMatch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        paymentId: Joi.string().required(),
        admissionNumber: Joi.number().integer().positive().required(),
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

      const { paymentId, admissionNumber, confirmed } = value;

      const student = await this.studentService.getStudentById(admissionNumber);
      if (!student) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STUDENT_NOT_FOUND',
            message: `Student with admission number ${admissionNumber} not found`
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const feeStructure = await this.studentService.getStudentFeeStructure(admissionNumber);

      res.status(200).json({
        success: true,
        data: {
          paymentId,
          student,
          feeStructure,
          matchType: 'manual',
          confirmed
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Manual match error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MANUAL_MATCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create manual match'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public createStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const schema = Joi.object({
        name1: Joi.string().required().max(30),
        name2: Joi.string().required().max(30),
        name3: Joi.string().optional().allow('').max(30),
        fphone: Joi.string().optional().allow('').max(20),
        dob: Joi.date().optional().allow(''),
        classId: Joi.number().integer().positive().required(),
        streamId: Joi.number().integer().positive().optional().allow(null),
        applyAdmissionCharge: Joi.boolean().default(true),
        admissionChargeAmount: Joi.number().min(0).default(500),
        applySchoolFees: Joi.boolean().default(true)
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

      const userId = req.user?.user_id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const result = await this.studentService.createStudent(value, userId);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Student added successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Create student error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create student'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public updateStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const admissionNumber = parseInt(req.params.admissionNumber, 10);
      if (isNaN(admissionNumber)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMETERS', message: 'Invalid admission number' }
        });
        return;
      }

      const schema = Joi.object({
        name1: Joi.string().max(50).optional(),
        name2: Joi.string().max(50).optional(),
        name3: Joi.string().max(50).allow(null, '').optional(),
        classId: Joi.number().integer().optional(),
        streamId: Joi.number().integer().allow(null).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
        return;
      }

      if (!req.user || !req.user.user_id) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
        });
        return;
      }

      await this.studentService.updateStudent(admissionNumber, value, req.user.user_id);

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Update student error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update student'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}