import { Request, Response } from 'express';
import receiptService from '../services/receiptService';

class ReceiptController {
  /**
   * Get all unprinted receipts
   */
  async getUnprintedReceipts(req: Request, res: Response): Promise<void> {
    try {
      const receipts = await receiptService.getUnprintedReceipts();
      res.json({
        success: true,
        data: receipts,
        count: receipts.length
      });
    } catch (error) {
      console.error('Error getting unprinted receipts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unprinted receipts'
      });
    }
  }

  /**
   * Get receipts for a specific student
   */
  async getReceiptsByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { adm } = req.params;
      const admNumber = parseInt(adm);

      if (isNaN(admNumber)) {
        res.status(400).json({
          success: false,
          message: 'Invalid admission number'
        });
        return;
      }

      const receipts = await receiptService.getReceiptsByStudent(admNumber);
      res.json({
        success: true,
        data: receipts,
        count: receipts.length
      });
    } catch (error) {
      console.error('Error getting student receipts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get student receipts'
      });
    }
  }

  /**
   * Get receipts for a specific term
   */
  async getReceiptsByTerm(req: Request, res: Response): Promise<void> {
    try {
      const { term, year } = req.params;
      const yearNumber = parseInt(year);

      if (isNaN(yearNumber)) {
        res.status(400).json({
          success: false,
          message: 'Invalid year'
        });
        return;
      }

      const receipts = await receiptService.getReceiptsByTerm(term, yearNumber);
      res.json({
        success: true,
        data: receipts,
        count: receipts.length
      });
    } catch (error) {
      console.error('Error getting term receipts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get term receipts'
      });
    }
  }

  /**
   * Get receipts for a specific class
   */
  async getReceiptsByClass(req: Request, res: Response): Promise<void> {
    try {
      const { className } = req.params;

      const receipts = await receiptService.getReceiptsByClass(className);
      res.json({
        success: true,
        data: receipts,
        count: receipts.length
      });
    } catch (error) {
      console.error('Error getting class receipts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get class receipts'
      });
    }
  }

  /**
   * Get previous receipts (already printed)
   */
  async getPreviousReceipts(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      const receipts = await receiptService.getPreviousReceipts(limit);
      res.json({
        success: true,
        data: receipts,
        count: receipts.length
      });
    } catch (error) {
      console.error('Error getting previous receipts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get previous receipts'
      });
    }
  }

  /**
   * Mark receipts as printed
   */
  async printReceipts(req: Request, res: Response): Promise<void> {
    try {
      const { receiptNumbers } = req.body;

      if (!Array.isArray(receiptNumbers) || receiptNumbers.length === 0) {
        res.status(400).json({
          success: false,
          message: 'receiptNumbers must be a non-empty array'
        });
        return;
      }

      await receiptService.printReceipts(receiptNumbers);
      res.json({
        success: true,
        message: `Marked ${receiptNumbers.length} receipts as printed`
      });
    } catch (error) {
      console.error('Error marking receipts as printed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark receipts as printed'
      });
    }
  }

  /**
   * Get print configuration
   */
  async getPrintConfig(req: Request, res: Response): Promise<void> {
    try {
      const [config, vars, schoolInfo] = await Promise.all([
        receiptService.getPrintConfig(),
        receiptService.getPrintVars(),
        receiptService.getSchoolInfo()
      ]);

      res.json({
        success: true,
        data: {
          config,
          vars,
          school: schoolInfo
        }
      });
    } catch (error) {
      console.error('Error getting print config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get print configuration'
      });
    }
  }

  /**
   * Get available classes and terms for filtering
   */
  async getFilterOptions(req: Request, res: Response): Promise<void> {
    try {
      const [classes, terms] = await Promise.all([
        receiptService.getAvailableClasses(),
        receiptService.getAvailableTerms()
      ]);

      res.json({
        success: true,
        data: {
          classes,
          terms
        }
      });
    } catch (error) {
      console.error('Error getting filter options:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get filter options'
      });
    }
  }

  /**
   * Get school logo
   */
  async getSchoolLogo(req: Request, res: Response): Promise<void> {
    try {
      const logo = await receiptService.getSchoolLogo();

      if (logo) {
        // Detect image type from buffer
        let contentType = 'image/png'; // default
        
        if (logo.length > 4) {
          // Check magic bytes
          if (logo[0] === 0xFF && logo[1] === 0xD8 && logo[2] === 0xFF) {
            contentType = 'image/jpeg';
          } else if (logo[0] === 0x89 && logo[1] === 0x50 && logo[2] === 0x4E && logo[3] === 0x47) {
            contentType = 'image/png';
          } else if (logo[0] === 0x47 && logo[1] === 0x49 && logo[2] === 0x46) {
            contentType = 'image/gif';
          } else if (logo[0] === 0x42 && logo[1] === 0x4D) {
            contentType = 'image/bmp';
          }
        }
        
        console.log(`Serving logo with content-type: ${contentType}, size: ${logo.length} bytes`);
        res.setHeader('Content-Type', contentType);
        res.send(logo);
      } else {
        console.log('No logo found in database');
        res.status(404).json({
          success: false,
          message: 'School logo not found'
        });
      }
    } catch (error) {
      console.error('Error getting school logo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get school logo'
      });
    }
  }
}

export default new ReceiptController();