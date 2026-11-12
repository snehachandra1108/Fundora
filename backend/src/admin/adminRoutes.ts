import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Get platform statistics (admin only)
router.get("/stats", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users) AS total_users,
          (SELECT COUNT(*) FROM campaigns) AS total_campaigns,
          (
            SELECT COALESCE(SUM(amount_raised), 0)
            FROM campaigns
          ) AS total_funds_raised
      `);

    res.json({
      stats: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching admin statistics:", error);

    res.status(500).json({
      message: "Failed to fetch platform statistics.",
    });
  }
});

// Get the five most recently registered users (admin only)
router.get("/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT id, name, email, role, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `);

    res.json({
      users: result.rows,
    });
  } catch (error) {
    console.error("Error fetching recent users:", error);

    res.status(500).json({
      message: "Failed to fetch recent users.",
    });
  }
});

export default router;
