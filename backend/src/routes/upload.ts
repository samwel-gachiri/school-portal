import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { AuthMiddleware } from '../middleware/auth';
import { uploadMiddleware, handleUploadError } from '../middleware/upload';

const router = Router();
const uploadController = new UploadController();
const authMiddleware = new AuthMiddleware();

// All upload routes require authentication
router.use(authMiddleware.authenticate);

// File upload routes
router.post('/image', uploadMiddleware, handleUploadError, uploadController.uploadImage);
router.get('/file/:fileId', uploadController.getFileInfo);
router.delete('/file/:fileId', uploadController.deleteFile);

export default router;