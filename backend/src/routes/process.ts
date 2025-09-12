import { Router } from 'express';
import { ProcessController } from '../controllers/processController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const processController = new ProcessController();
const authMiddleware = new AuthMiddleware();

// All process routes require authentication
router.use(authMiddleware.authenticate);

// AI processing routes
router.post('/extract', processController.extractPaymentData);
router.post('/validate', processController.validateExtractedData);

// AI service management routes
router.get('/ai/test', processController.testAIConnection);
router.get('/ai/usage', processController.getAIUsage);

export default router;