import { Router } from "express";
import { AuthMiddleware } from "../middleware/auth";
import { manualFeeController } from "../controllers/manualFeeController";

const router = Router();
const authMiddleware = new AuthMiddleware();

console.log("🔧 Loading manual fees routes...");

// All routes require authentication
router.use(authMiddleware.authenticate);

// Manual fee input routes
router.get("/students/search", manualFeeController.searchStudents);
router.get("/students/:adm", manualFeeController.getStudentDetails);
router.post("/validate-reference", manualFeeController.validateReference);
router.post("/payments", manualFeeController.createPayment);
router.put("/payments/:paymentId", manualFeeController.updatePayment);
router.delete("/payments/:paymentId", manualFeeController.deletePayment);
router.get("/bank-types", manualFeeController.getBankTypes);
router.get("/check-duplicate", manualFeeController.checkDuplicatePayment);
router.post("/recalculate-balances", manualFeeController.recalculateBalances);

console.log("✅ Manual fees routes configured:", {
  "GET /students/search": "searchStudents",
  "GET /students/:adm": "getStudentDetails",
  "POST /validate-reference": "validateReference",
  "POST /payments": "createPayment",
  "PUT /payments/:paymentId": "updatePayment",
  "DELETE /payments/:paymentId": "deletePayment",
  "GET /bank-types": "getBankTypes",
  "GET /check-duplicate": "checkDuplicatePayment",
});

export default router;
