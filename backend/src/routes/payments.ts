import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const paymentController = new PaymentController();
const authMiddleware = new AuthMiddleware();

// All payment routes require authentication
router.use(authMiddleware.authenticate);

// Payment processing routes
router.post('/validate-batch', paymentController.validateBatch);
router.post('/process-batch', paymentController.processBatch);

// Payment history and statistics routes
router.get('/history', paymentController.getHistory);
router.get('/statistics', paymentController.getStatistics);

export default router;