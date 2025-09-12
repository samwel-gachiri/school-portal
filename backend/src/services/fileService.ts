import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

export interface FileUploadResult {
  success: boolean;
  fileId?: string;
  originalName?: string;
  filePath?: string;
  size?: number;
  mimeType?: string;
  error?: string;
}

export interface ProcessedFile {
  fileId: string;
  originalName: string;
  filePath: string;
  size: number;
  mimeType: string;
  base64Data: string;
}

export class FileService {
  private uploadPath: string;
  private allowedMimeTypes: string[] = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];
  private allowedExtensions: string[] = ['.jpg', '.jpeg', '.png', '.pdf'];

  constructor() {
    this.uploadPath = config.upload.uploadPath;
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  public validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > config.upload.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${config.upload.maxFileSize / 1024 / 1024}MB`
      };
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      };
    }

    // Check file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `File extension ${fileExtension} is not allowed. Allowed extensions: ${this.allowedExtensions.join(', ')}`
      };
    }

    return { valid: true };
  }

  public async saveFile(file: Express.Multer.File): Promise<FileUploadResult> {
    try {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const filePath = path.join(this.uploadPath, fileName);

      await fs.writeFile(filePath, file.buffer);

      return {
        success: true,
        fileId,
        originalName: file.originalname,
        filePath,
        size: file.size,
        mimeType: file.mimetype
      };
    } catch (error) {
      console.error('File save error:', error);
      return {
        success: false,
        error: 'Failed to save file due to server error'
      };
    }
  }

  public async getFileAsBase64(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return fileBuffer.toString('base64');
    } catch (error) {
      console.error('File read error:', error);
      throw new Error('Failed to read file');
    }
  }

  public async processUploadedFile(file: Express.Multer.File): Promise<ProcessedFile> {
    const uploadResult = await this.saveFile(file);
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'File upload failed');
    }

    const base64Data = await this.getFileAsBase64(uploadResult.filePath!);

    return {
      fileId: uploadResult.fileId!,
      originalName: uploadResult.originalName!,
      filePath: uploadResult.filePath!,
      size: uploadResult.size!,
      mimeType: uploadResult.mimeType!,
      base64Data
    };
  }

  public async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  public async cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.uploadPath);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.uploadPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await this.deleteFile(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('File cleanup error:', error);
    }
  }

  public getFileInfo(filePath: string): Promise<{ size: number; mtime: Date }> {
    return fs.stat(filePath);
  }
}