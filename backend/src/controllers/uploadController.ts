import { Request, Response } from 'express';
import { FileService } from '../services/fileService';
import { AuthenticatedRequest } from '../middleware/auth';

export class UploadController {
  private fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  public uploadImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file uploaded'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      const processedFile = await this.fileService.processUploadedFile(req.file);

      res.status(200).json({
        success: true,
        data: {
          fileId: processedFile.fileId,
          originalName: processedFile.originalName,
          size: processedFile.size,
          mimeType: processedFile.mimeType,
          base64Data: processedFile.base64Data
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Upload controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'File upload failed'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public getFileInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILE_ID',
            message: 'File ID is required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // This would typically involve looking up file metadata from database
      // For now, we'll return a simple response
      res.status(200).json({
        success: true,
        data: {
          fileId,
          message: 'File info endpoint - implementation depends on file metadata storage'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Get file info error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve file information'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  public deleteFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILE_ID',
            message: 'File ID is required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // This would typically involve looking up file path from database
      // and then deleting the file
      res.status(200).json({
        success: true,
        data: {
          message: 'File deletion endpoint - implementation depends on file metadata storage'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Delete file error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete file'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}