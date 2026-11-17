
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

// Get all contributions across Fundora (admin only)

// Get contributions across Fundora with pagination (admin only)
router.get(
  "/contributions",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const page = Math.max(
        1,
        Number.parseInt(String(req.query.page ?? "1"), 10) || 1
      );

      const limit = 10;
      const offset = (page - 1) * limit;

      const countResult = await pool.query(`
        SELECT COUNT(*) AS total
        FROM contributions
      `);

      const total = Number(countResult.rows[0].total);
      const totalPages = Math.max(1, Math.ceil(total / limit));

      const result = await pool.query(
        `SELECT
           contributions.id,
           contributions.amount,
           contributions.utr_reference,
           contributions.status,
           contributions.created_at,
           users.name AS supporter_name,
           users.email AS supporter_email,
           campaigns.title AS campaign_title
         FROM contributions
         JOIN users
           ON contributions.supporter_id = users.id
         JOIN campaigns
           ON contributions.campaign_id = campaigns.id
         ORDER BY contributions.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return res.json({
        contributions: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching all contributions:", error);

      return res.status(500).json({
        message: "Failed to fetch contributions.",
      });
    }
  }
);


export default router;
