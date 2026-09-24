import { Request, Response } from "express";
import { manualFeeService } from "../services/manualFeeService";
import logger from "../utils/logger";
import { AuthenticatedRequest } from "../middleware/auth";

export const manualFeeController = {
  async searchStudents(req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const students = await manualFeeService.searchStudents(query);

      return res.json({
        success: true,
        data: students,
      });
    } catch (error) {
      logger.error("Error searching students:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to search students",
      });
    }
  },

  async getStudentDetails(req: Request, res: Response) {
    try {
      const { adm } = req.params;
      const admNumber = parseInt(adm);

      if (isNaN(admNumber)) {
        return res.status(400).json({
          success: false,
          message: "Invalid admission number",
        });
      }

      const student = await manualFeeService.getStudentDetails(admNumber);
      const paymentHistory = await manualFeeService.getPaymentHistory(
        admNumber
      );

      return res.json({
        success: true,
        data: {
          student,
          paymentHistory,
        },
      });
    } catch (error) {
      logger.error("Error getting student details:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to get student details",
      });
    }
  },

  async validateReference(req: Request, res: Response) {
    try {
      const { bank, ref } = req.body;

      if (!bank || !ref) {
        return res.status(400).json({
          success: false,
          message: "Bank and reference are required",
        });
      }

      const validation = manualFeeService.validateReference(bank, ref);
      const isUnique = validation.valid
        ? await manualFeeService.checkReferenceUniqueness(bank, ref)
        : false;

      return res.json({
        success: true,
        data: {
          valid: validation.valid && isUnique,
          errors: validation.valid
            ? isUnique
              ? []
              : ["Reference number already exists"]
            : validation.errors,
        },
      });
    } catch (error) {
      logger.error("Error validating reference:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to validate reference",
      });
    }
  },

  async createPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { adm, bank, ref, amount, date } = req.body;
      const userId = req.user?.user_id;
      const username = req.user?.username;

      // Validate required fields
      if (!adm || !bank || !amount || !date) {
        return res.status(400).json({
          success: false,
          message: "Admission number, bank, amount, and date are required",
        });
      }

      if (!userId || !username) {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      const paymentData = {
        adm: parseInt(adm),
        bank,
        ref: ref || undefined,
        amount: parseFloat(amount),
        date,
        processedBy: userId,
      };

      const payment = await manualFeeService.createPayment(
        paymentData,
        username
      );

      return res.json({
        success: true,
        data: payment,
        message: "Payment processed successfully",
      });
    } catch (error) {
      logger.error("Error creating payment:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to process payment",
      });
    }
  },

  async getBankTypes(req: Request, res: Response) {
    try {
      const bankTypes = await manualFeeService.getBankTypes();

      return res.json({
        success: true,
        data: bankTypes,
      });
    } catch (error) {
      logger.error("Error getting bank types:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get bank types",
      });
    }
  },

  async checkDuplicatePayment(req: Request, res: Response) {
    try {
      const { adm, ref, bank } = req.query;

      if (!adm || !ref || !bank) {
        return res.status(400).json({
          success: false,
          message: "Admission number, reference, and bank are required",
        });
      }

      const duplicate = await manualFeeService.checkDuplicatePayment(
        parseInt(adm as string),
        ref as string,
        bank as string
      );

      return res.json({
        success: true,
        data: {
          isDuplicate: !!duplicate,
          duplicatePayment: duplicate,
        },
      });
    } catch (error) {
      logger.error("Error checking duplicate payment:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to check duplicate payment",
      });
    }
  },

  async updatePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentId } = req.params;
      const { bank, ref, amount, date, reason } = req.body;
      const userId = req.user?.user_id;
      const username = req.user?.username;

      const pId = parseInt(paymentId, 10);
      if (isNaN(pId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment ID",
        });
      }

      if (!bank || !amount || !date) {
        return res.status(400).json({
          success: false,
          message: "Bank, amount, and date are required",
        });
      }

      if (!reason || !String(reason).trim()) {
        return res.status(400).json({
          success: false,
          message: "Reason for payment modification is required",
        });
      }

      if (!userId || !username) {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      const paymentData = {
        bank,
        ref: ref || undefined,
        amount: parseFloat(amount),
        date,
        reason: String(reason).trim(),
        processedBy: userId,
      };

      const updated = await manualFeeService.updatePayment(
        pId,
        paymentData,
        username
      );

      return res.json({
        success: true,
        data: updated,
        message: "Payment updated successfully",
      });
    } catch (error) {
      logger.error("Error updating payment:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update payment",
      });
    }
  },

  async deletePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.user_id;
      const rawReason = (req.body?.reason || req.query?.reason || '') as string;
      const reason = String(rawReason).trim();

      const pId = parseInt(paymentId, 10);
      if (isNaN(pId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment ID",
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Reason for payment deletion is required",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      const username = req.user?.username || 'admin';
      const result = await manualFeeService.deletePayment(pId, userId, username, reason);

      return res.json({
        success: true,
        data: result,
        message: "Payment deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting payment:", error);
      return res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete payment",
      });
    }
  },

  async recalculateBalances(req: AuthenticatedRequest, res: Response) {
    try {
      const rawAdm = req.body?.adm || req.query?.adm;
      const adm = rawAdm ? parseInt(String(rawAdm), 10) : undefined;

      const newBalance = await manualFeeService.recalculateStudentBalance(adm);

      return res.json({
        success: true,
        message: adm
          ? `Balance recalculated successfully for student #${adm}`
          : "All student balances recalculated successfully",
        data: adm ? { adm, newBalance } : undefined,
      });
    } catch (error) {
      logger.error("Error recalculating balances:", error);
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to recalculate balances",
      });
    }
  },
};
