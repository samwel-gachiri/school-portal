import { Request, Response } from "express";
import { classService } from "../services/classService";
import logger from "../utils/logger";

export class ClassController {
  /**
   * Get all classes with cumulative balance
   */
  async getClasses(req: Request, res: Response): Promise<void> {
    try {
      const classes = await classService.getClasses();
      
      res.status(200).json({
        success: true,
        data: classes
      });
    } catch (error: any) {
      logger.error('Error fetching classes:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch classes'
        }
      });
    }
  }

  /**
   * Get class details by ID
   */
  async getClassById(req: Request, res: Response): Promise<void> {
    try {
      const classId = parseInt(req.params.classId);
      if (isNaN(classId)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Invalid class ID' }
        });
        return;
      }

      const cls = await classService.getClassById(classId);
      if (!cls) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Class not found' }
        });
        return;
      }

      res.status(200).json({ success: true, data: cls });
    } catch (error: any) {
      logger.error(`Error fetching class ${req.params.classId}:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch class' }
      });
    }
  }

  /**
   * Get all students for a specific class
   */
  async getClassStudents(req: Request, res: Response): Promise<void> {
    try {
      const classId = parseInt(req.params.classId);
      if (isNaN(classId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid class ID'
          }
        });
        return;
      }

      const students = await classService.getClassStudents(classId);
      
      res.status(200).json({
        success: true,
        data: students
      });
    } catch (error: any) {
      logger.error(`Error fetching students for class ${req.params.classId}:`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch class students'
        }
      });
    }
  }
}

export const classController = new ClassController();
