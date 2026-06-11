import { Router } from "express";
import { AuthMiddleware } from "../middleware/auth";
import { chargeController } from "../controllers/chargeController";

const router = Router();
const authMiddleware = new AuthMiddleware();

router.use(authMiddleware.authenticate);

router.get("/defaults", chargeController.getDefaults);
router.get("/students/search", chargeController.searchStudents);
router.get("/students/:adm", chargeController.getStudentCharges);
router.post("/student", chargeController.createStudentCharge);
router.post("/class", chargeController.createClassCharge);

export default router;
