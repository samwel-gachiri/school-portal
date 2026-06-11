import { Router } from "express";
import { DatabaseConnection } from "../config/database";
import logger from "../utils/logger";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Protect all school routes
router.use(requireAuth);

router.get("/info", async (req, res) => {
  try {
    const db = DatabaseConnection.getInstance();
    const rows = await db.query('SELECT name, term, year FROM school LIMIT 1');
    if (rows && rows.length > 0) {
      return res.json({ 
        success: true, 
        data: {
          name: rows[0].name ? rows[0].name.replace(/_/g, ' ') : 'Little Angels Academy',
          term: rows[0].term,
          year: rows[0].year
        } 
      });
    }
    return res.json({ 
      success: true, 
      data: { name: 'School Portal', term: 'ONE', year: new Date().getFullYear() } 
    });
  } catch (error) {
    logger.error("Error getting school info:", error);
    return res.status(500).json({ success: false, message: "Failed to get school info" });
  }
});

export default router;
