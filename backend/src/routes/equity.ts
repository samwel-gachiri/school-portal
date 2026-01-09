import { Router } from 'express';
import { equityController } from '../controllers/equityController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Webhook endpoint (no auth - verified by signature)
router.post('/webhook', equityController.webhookHandler);

// Protected routes (require authentication)
router.get('/transactions/pending', requireAuth, equityController.getPendingTransactions);
router.get('/transactions/:transactionId/suggestions', requireAuth, equityController.getTransactionWithSuggestions);
router.post('/transactions/:transactionId/match', requireAuth, equityController.manualMatch);
router.post('/transactions/:transactionId/post', requireAuth, equityController.postTransaction);
router.post('/transactions/:transactionId/reject', requireAuth, equityController.rejectTransaction);
router.post('/sync', requireAuth, equityController.syncTransactions);
router.get('/stats', requireAuth, equityController.getStats);
router.get('/balance', requireAuth, equityController.getBalance);

export default router;
