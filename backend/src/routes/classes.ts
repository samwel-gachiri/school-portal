import { Router } from "express";
import { classController } from "../controllers/classController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get list of classes with balances
router.get("/", classController.getClasses);

// Get single class details
router.get("/:classId", classController.getClassById);

// Get students for a specific class
router.get("/:classId/students", classController.getClassStudents);

export default router;
