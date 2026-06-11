import { Router } from 'express';
import { StudentController } from '../controllers/studentController';
import { AuthMiddleware } from '../middleware/auth';

const router = Router();
const studentController = new StudentController();
const authMiddleware = new AuthMiddleware();

// All student routes require authentication
router.use(authMiddleware.authenticate);

// Student search and matching routes
router.get('/search', studentController.searchStudents);
router.post('/match', studentController.matchStudents);
router.post('/manual-match', studentController.manualMatch);
router.post('/', studentController.createStudent);
router.get('/:admissionNumber', studentController.getStudentDetails);

export default router;