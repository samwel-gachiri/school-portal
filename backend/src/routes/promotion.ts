import { Router } from 'express';
import { promotionController } from '../controllers/promotionController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Preview promotion (dry run)
router.get('/preview', promotionController.previewPromotion);

// Get all classes
router.get('/classes', promotionController.getClasses);

// Promote all students
router.post('/promote-all', promotionController.promoteAllStudents);

// Promote students from a specific class
router.post('/promote-class/:classId', promotionController.promoteClass);

export default router;
