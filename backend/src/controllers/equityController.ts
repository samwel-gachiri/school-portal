import { Request, Response } from 'express';
import { jengaApiService } from '../services/jengaApiService';
import { equityTransactionService } from '../services/equityTransactionService';
import logger from '../utils/logger';

export const equityController = {
  /**
   * Webhook endpoint for Equity transaction notifications
   */
  async webhookHandler(req: Request, res: Response): Promise<void> {
    try {
      console.log('=== EQUITY WEBHOOK RECEIVED ===');
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body:', JSON.stringify(req.body, null, 2));
      
      const signature = req.headers['x-jenga-signature'] as string;
      const payload = JSON.stringify(req.body);

      // Verify webhook signature for security
      if (!jengaApiService.verifyWebhookSignature(payload, signature)) {
        logger.warn('Invalid webhook signature');
        console.log('⚠️  Webhook signature verification failed');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      console.log('✅ Webhook signature verified');
      const transaction = req.body;

      // Store transaction
      const transactionData = {
        transaction_ref: transaction.transactionReference || transaction.reference,
        transaction_date: transaction.transactionDate || transaction.date,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency || 'KES',
        depositor_name: transaction.depositorName,
        depositor_mobile: transaction.depositorMobile || transaction.mobile,
        payment_description: transaction.paymentDescription || transaction.description,
        narration: transaction.narration,
      };
      
      console.log('📝 Storing transaction:', transactionData);
      const transactionId = await equityTransactionService.storeTransaction(transactionData);
      console.log(`✅ Transaction stored with ID: ${transactionId}`);

      // Attempt auto-matching
      console.log('🔍 Attempting auto-match...');
      const matchResult = await equityTransactionService.autoMatchTransaction(transactionId);
      console.log('🎯 Match result:', {
        matched: matchResult.matched,
        confidence: matchResult.confidence,
        method: matchResult.matchMethod,
        student: matchResult.student,
      });

      logger.info(`Webhook processed: ${transaction.transactionReference}`, {
        transactionId,
        matched: matchResult.matched,
        confidence: matchResult.confidence,
      });

      // Return 200 to acknowledge receipt
      res.status(200).json({
        success: true,
        transactionId,
        matched: matchResult.matched,
        confidence: matchResult.confidence,
      });
    } catch (error: any) {
      logger.error('Webhook handler error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * Get pending transactions for review
   */
  async getPendingTransactions(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await equityTransactionService.getPendingTransactions(limit);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error: any) {
      logger.error('Error fetching pending transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
      });
    }
  },

  /**
   * Get transaction with auto-match suggestions
   */
  async getTransactionWithSuggestions(req: Request, res: Response) {
    try {
      const { transactionId } = req.params;
      const matchResult = await equityTransactionService.autoMatchTransaction(
        parseInt(transactionId)
      );

      res.json({
        success: true,
        data: matchResult,
      });
    } catch (error: any) {
      logger.error('Error getting transaction suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get suggestions',
      });
    }
  },

  /**
   * Manually match transaction to student
   */
  async manualMatch(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { studentAdm } = req.body;
      const userId = (req as any).user?.userId;

      if (!studentAdm) {
        res.status(400).json({
          success: false,
          message: 'Student admission number is required',
        });
        return;
      }

      await equityTransactionService.manualMatchTransaction(
        parseInt(transactionId),
        studentAdm,
        userId
      );

      res.json({
        success: true,
        message: 'Transaction matched successfully',
      });
    } catch (error: any) {
      logger.error('Error matching transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to match transaction',
      });
      return;
    }
  },

  /**
   * Post matched transaction as payment
   */
  async postTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const userId = (req as any).user?.userId;

      const paymentId = await equityTransactionService.postTransaction(
        parseInt(transactionId),
        userId
      );

      res.json({
        success: true,
        message: 'Payment posted successfully',
        data: { paymentId },
      });
    } catch (error: any) {
      logger.error('Error posting transaction:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to post transaction',
      });
    }
  },

  /**
   * Reject transaction
   */
  async rejectTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.userId;

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
        return;
      }

      await equityTransactionService.rejectTransaction(
        parseInt(transactionId),
        reason,
        userId
      );

      res.json({
        success: true,
        message: 'Transaction rejected',
      });
    } catch (error: any) {
      logger.error('Error rejecting transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject transaction',
      });
      return;
    }
  },

  /**
   * Sync recent transactions from Jenga API
   */
  async syncTransactions(req: Request, res: Response): Promise<void> {
    try {
      // Get transactions from today
      const today = new Date().toISOString().split('T')[0];
      const transactions = await jengaApiService.getAccountTransactions(today, today);

      let imported = 0;
      let matched = 0;

      for (const transaction of transactions) {
        try {
          const transactionId = await equityTransactionService.storeTransaction({
            transaction_ref: transaction.transactionReference,
            transaction_date: transaction.transactionDate,
            amount: transaction.amount,
            currency: transaction.currency,
            depositor_name: transaction.depositorName,
            depositor_mobile: transaction.depositorMobile,
            payment_description: transaction.paymentDescription,
            narration: transaction.narration,
          });

          imported++;

          const matchResult = await equityTransactionService.autoMatchTransaction(transactionId);
          if (matchResult.matched) {
            matched++;
          }
        } catch (error: any) {
          // Skip duplicates
          if (!error.message.includes('already exists')) {
            logger.error('Error importing transaction:', error);
          }
        }
      }

      res.json({
        success: true,
        message: 'Transactions synced successfully',
        data: {
          total: transactions.length,
          imported,
          matched,
        },
      });
    } catch (error: any) {
      logger.error('Error syncing transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync transactions',
      });
      return;
    }
  },

  /**
   * Get transaction statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await equityTransactionService.getTransactionStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get statistics',
      });
    }
  },

  /**
   * Get account balance from Jenga API
   */
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const balance = await jengaApiService.getAccountBalance();

      res.json({
        success: true,
        data: balance,
      });
    } catch (error: any) {
      logger.error('Error getting balance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get account balance',
      });
    }
  },
};
