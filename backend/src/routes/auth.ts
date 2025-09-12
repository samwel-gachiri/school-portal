import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.post('/login', authController.login);

// Protected routes
router.post('/logout', authMiddleware.authenticate, authController.logout);
router.get('/verify', authMiddleware.authenticate, authController.verify);
router.get('/sessions', authMiddleware.authenticate, authController.getSessions);

export default router;