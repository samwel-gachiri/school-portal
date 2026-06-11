import { Request, Response } from 'express';
import { promotionService } from '../services/promotionService';
import logger from '../utils/logger';

export const promotionController = {
  /**
   * Preview student promotion without making changes
   */
  async previewPromotion(req: Request, res: Response) {
    try {
      console.log('📋 Generating promotion preview...');
      const preview = await promotionService.previewPromotion();

      res.json({
        success: true,
        message: 'Promotion preview generated',
        data: preview
      });
    } catch (error: any) {
      logger.error('Error generating promotion preview:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate preview'
      });
    }
  },

  /**
   * Promote all students to next class
   * Students in exit class are transferred out
   */
  async promoteAllStudents(req: Request, res: Response): Promise<void> {
    try {
      const { confirm } = req.body;

      if (!confirm) {
        res.status(400).json({
          success: false,
          message: 'Please confirm the promotion by setting confirm: true in the request body'
        });
        return;
      }

      console.log('🎓 Starting full student promotion...');
      const result = await promotionService.promoteAllStudents();

      res.json({
        success: result.success,
        message: result.message,
        data: result.summary
      });
    } catch (error: any) {
      logger.error('Error promoting students:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Promotion failed'
      });
      return;
    }
  },

  /**
   * Promote students from a specific class
   */
  async promoteClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const { confirm } = req.body;

      if (!classId) {
        res.status(400).json({
          success: false,
          message: 'Class ID is required'
        });
        return;
      }

      if (!confirm) {
        res.status(400).json({
          success: false,
          message: 'Please confirm the promotion by setting confirm: true in the request body'
        });
        return;
      }

      console.log(`🎓 Promoting students from class ${classId}...`);
      const result = await promotionService.promoteClassStudents(parseInt(classId));

      res.json({
        success: result.success,
        message: result.message,
        data: result.summary
      });
    } catch (error: any) {
      logger.error('Error promoting class:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Class promotion failed'
      });
      return;
    }
  },

  /**
   * Get list of classes with student counts
   */
  async getClasses(req: Request, res: Response): Promise<void> {
    try {
      const classes = await promotionService.getClassesByPosition();

      res.json({
        success: true,
        data: classes
      });
    } catch (error: any) {
      logger.error('Error fetching classes:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch classes'
      });
    }
  }
};
