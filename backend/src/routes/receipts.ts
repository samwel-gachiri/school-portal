import { Router } from 'express';
import receiptController from '../controllers/receiptController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const authMiddleware = new AuthMiddleware();

// Apply authentication middleware to all receipt routes
router.use(authMiddleware.authenticate);

/**
 * @route GET /api/receipts/unprinted
 * @desc Get all unprinted receipts
 * @access Private
 */
router.get('/unprinted', receiptController.getUnprintedReceipts);

/**
 * @route GET /api/receipts/student/:adm
 * @desc Get receipts for a specific student
 * @access Private
 */
router.get('/student/:adm', receiptController.getReceiptsByStudent);

/**
 * @route GET /api/receipts/term/:term/:year
 * @desc Get receipts for a specific term and year
 * @access Private
 */
router.get('/term/:term/:year', receiptController.getReceiptsByTerm);

/**
 * @route GET /api/receipts/class/:className
 * @desc Get receipts for a specific class
 * @access Private
 */
router.get('/class/:className', receiptController.getReceiptsByClass);

/**
 * @route GET /api/receipts/previous
 * @desc Get previous receipts (already printed)
 * @access Private
 */
router.get('/previous', receiptController.getPreviousReceipts);

/**
 * @route POST /api/receipts/mark-printed
 * @desc Mark receipts as printed
 * @access Private
 */
router.post('/mark-printed', receiptController.markAsPrinted);

/**
 * @route GET /api/receipts/config
 * @desc Get print configuration
 * @access Private
 */
router.get('/config', receiptController.getPrintConfig);

/**
 * @route GET /api/receipts/filters
 * @desc Get available filter options (classes, terms)
 * @access Private
 */
router.get('/filters', receiptController.getFilterOptions);

/**
 * @route GET /api/receipts/logo
 * @desc Get school logo
 * @access Private
 */
router.get('/logo', receiptController.getSchoolLogo);

export default router;