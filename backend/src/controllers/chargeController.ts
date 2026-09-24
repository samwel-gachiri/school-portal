import { Request, Response } from "express";
import { chargeService } from "../services/chargeService";
import logger from "../utils/logger";
import { AuthenticatedRequest } from "../middleware/auth";

export const chargeController = {
  async getDefaults(req: Request, res: Response) {
    try {
      const defaults = await chargeService.getCurrentTermYear();
      const classes = await chargeService.getClasses();
      const streams = await chargeService.getStreams();
      return res.json({
        success: true,
        data: {
          term: defaults.term,
          year: defaults.year,
          classes,
          streams
        }
      });
    } catch (error) {
      logger.error("Error getting charge defaults:", error);
      return res.status(500).json({ success: false, message: "Failed to load defaults" });
    }
  },

  async searchStudents(req: Request, res: Response) {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ success: false, message: "Query required" });
      }
      const students = await chargeService.searchStudents(query);
      return res.json({ success: true, data: students });
    } catch (error) {
      logger.error("Error searching students for charges:", error);
      return res.status(500).json({ success: false, message: "Search failed" });
    }
  },

  async getStudentCharges(req: Request, res: Response) {
    try {
      const { adm } = req.params;
      const charges = await chargeService.getStudentCharges(parseInt(adm));
      return res.json({ success: true, data: charges });
    } catch (error) {
      logger.error("Error getting student charges:", error);
      return res.status(500).json({ success: false, message: "Failed to get charges" });
    }
  },

  async createStudentCharge(req: AuthenticatedRequest, res: Response) {
    try {
      const { adm, name, amount, term, yearAss, dateAss } = req.body;
      const userId = req.user?.user_id;

      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!adm || !name || !amount || !term || !yearAss || !dateAss) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const charge = await chargeService.createStudentCharge(
        parseInt(adm),
        { name, amount: parseFloat(amount), term, yearAss: parseInt(yearAss), dateAss },
        userId
      );

      return res.json({ success: true, data: charge, message: "Charge added successfully" });
    } catch (error) {
      logger.error("Error creating student charge:", error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to create charge" 
      });
    }
  },

  async createClassCharge(req: AuthenticatedRequest, res: Response) {
    try {
      const { classId, name, amount, term, yearAss, dateAss } = req.body;
      const userId = req.user?.user_id;

      if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!classId || !name || !amount || !term || !yearAss || !dateAss) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const result = await chargeService.createClassCharge(
        parseInt(classId),
        { name, amount: parseFloat(amount), term, yearAss: parseInt(yearAss), dateAss },
        userId
      );

      return res.json({ success: true, data: result, message: `Successfully charged ${result.count} students` });
    } catch (error) {
      logger.error("Error creating class charge:", error);
      return res.status(400).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to create class charge" 
      });
    }
  },

  async updateCharge(req: AuthenticatedRequest, res: Response) {
    try {
      const { chargeId } = req.params;
      const { name, amount, term, yearAss, dateAss, reason } = req.body;
      const userId = req.user?.user_id;
      const username = req.user?.username || 'admin';

      const cId = parseInt(chargeId, 10);
      if (isNaN(cId)) {
        return res.status(400).json({ success: false, message: "Invalid charge ID" });
      }

      if (!name || amount === undefined || amount === null || !term || !yearAss || !dateAss) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      if (parseFloat(amount) <= 0) {
        return res.status(400).json({ success: false, message: "Charge amount must be positive" });
      }

      if (!reason || !String(reason).trim()) {
        return res.status(400).json({ success: false, message: "Reason for charge modification is required" });
      }

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const updated = await chargeService.updateCharge(
        cId,
        {
          name: String(name).trim(),
          amount: parseFloat(amount),
          term: String(term),
          yearAss: parseInt(yearAss, 10),
          dateAss: String(dateAss),
          reason: String(reason).trim()
        },
        userId,
        username
      );

      return res.json({
        success: true,
        data: updated,
        message: "Charge updated successfully"
      });
    } catch (error) {
      logger.error("Error updating charge:", error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to update charge"
      });
    }
  },

  async deleteCharge(req: AuthenticatedRequest, res: Response) {
    try {
      const { chargeId } = req.params;
      const userId = req.user?.user_id;
      const username = req.user?.username || 'admin';
      const rawReason = (req.body?.reason || req.query?.reason || '') as string;
      const reason = String(rawReason).trim();

      const cId = parseInt(chargeId, 10);
      if (isNaN(cId)) {
        return res.status(400).json({ success: false, message: "Invalid charge ID" });
      }

      if (!reason) {
        return res.status(400).json({ success: false, message: "Reason for charge deletion is required" });
      }

      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const result = await chargeService.deleteCharge(cId, userId, username, reason);

      return res.json({
        success: true,
        data: result,
        message: "Charge deleted successfully"
      });
    } catch (error) {
      logger.error("Error deleting charge:", error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete charge"
      });
    }
  }
};

