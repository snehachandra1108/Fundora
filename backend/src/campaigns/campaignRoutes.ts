
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { Router } from "express";
import { pool } from "../config/db.js";

const router = Router();

// GET /api/campaigns
// Retrieve all approved campaigns.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM campaigns
       WHERE status = 'approved'
       ORDER BY created_at DESC`
    );

    return res.json({
      campaigns: result.rows,
    });
  } catch (error) {
    console.error("Fetch campaigns error:", error);

    return res.status(500).json({
      message: "Something went wrong while fetching campaigns.",
    });
  }
});

// POST /api/campaigns
// Create a new campaign.
router.post(
  "/",
  requireAuth,
  requireRole("user"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        goal,
        deadline,
        image,
      } = req.body;

      if (
        !title?.trim() ||
        !description?.trim() ||
        !category?.trim() ||
        goal === undefined ||
        !deadline
      ) {
        return res.status(400).json({
          message: "Please provide all required campaign details.",
        });
      }

      const campaignGoal = Number(goal);

      if (!Number.isFinite(campaignGoal) || campaignGoal <= 0) {
        return res.status(400).json({
          message: "Campaign goal must be a positive number.",
        });
      }

      const campaignDeadline = new Date(deadline);

      if (
        Number.isNaN(campaignDeadline.getTime()) ||
        campaignDeadline.toISOString().slice(0, 10) <=
          new Date().toISOString().slice(0, 10)
      ) {
        return res.status(400).json({
          message: "Please provide a valid future deadline.",
        });
      }

      const creatorId = res.locals.user.id;

      const result = await pool.query(
        `INSERT INTO campaigns (
          title,
          description,
          category,
          goal,
          deadline,
          image,
          creator_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          title.trim(),
          description.trim(),
          category.trim(),
          campaignGoal,
          deadline,
          image || null,
          creatorId,
        ]
      );

      return res.status(201).json({
        message: "Campaign submitted successfully!",
        campaign: result.rows[0],
      });
    } catch (error) {
      console.error("Create campaign error:", error);

      return res.status(500).json({
        message: "Something went wrong while creating the campaign.",
      });
    }
  }
);

// GET /api/campaigns/my
// Retrieve campaigns created by the logged-in user.
router.get(
  "/my",
  requireAuth,
  requireRole("user"),
  async (req, res) => {
    try {
      const creatorId = res.locals.user.id;

      const result = await pool.query(
        `SELECT *
         FROM campaigns
         WHERE creator_id = $1
         ORDER BY created_at DESC`,
        [creatorId]
      );

      return res.json({
        campaigns: result.rows,
      });
    } catch (error) {
      console.error("Fetch creator campaigns error:", error);

      return res.status(500).json({
        message: "Something went wrong while fetching your campaigns.",
      });
    }
  }
);

// GET /api/campaigns/pending
// Admin retrieves campaigns awaiting moderation.
router.get(
  "/pending",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
           campaigns.*,
           users.name AS creator_name,
           users.email AS creator_email
         FROM campaigns
         JOIN users
           ON campaigns.creator_id = users.id
         WHERE campaigns.status = 'pending'
         ORDER BY campaigns.created_at DESC`
      );

      return res.json({
        campaigns: result.rows,
      });
    } catch (error) {
      console.error("Fetch pending campaigns error:", error);

      return res.status(500).json({
        message: "Something went wrong while fetching pending campaigns.",
      });
    }
  }
);

// PATCH /api/campaigns/:id/status
// Admin approves or rejects a campaign.
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const campaignId = Number(req.params.id);

      if (!Number.isInteger(campaignId) || campaignId <= 0) {
        return res.status(400).json({
          message: "Invalid campaign ID.",
        });
      }

      const { status } = req.body;

      if (status !== "approved" && status !== "rejected") {
        return res.status(400).json({
          message: "Status must be approved or rejected.",
        });
      }

      const existingCampaign = await pool.query(
        `SELECT *
         FROM campaigns
         WHERE id = $1`,
        [campaignId]
      );

      if (existingCampaign.rows.length === 0) {
        return res.status(404).json({
          message: "Campaign not found.",
        });
      }

      if (existingCampaign.rows[0].status !== "pending") {
        return res.status(400).json({
          message: "Only pending campaigns can be reviewed.",
        });
      }

      const result = await pool.query(
        `UPDATE campaigns
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, campaignId]
      );

      return res.json({
        message: `Campaign ${status} successfully!`,
        campaign: result.rows[0],
      });
    } catch (error) {
      console.error("Campaign moderation error:", error);

      return res.status(500).json({
        message: "Something went wrong while reviewing the campaign.",
      });
    }
  }
);

// GET /api/campaigns/:id
// Retrieve a campaign along with its creator's public payment details.
router.get("/:id", async (req, res) => {
  try {
    const campaignId = Number(req.params.id);

    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      return res.status(400).json({
        message: "Invalid campaign ID.",
      });
    }

    // Join campaigns with users to retrieve creator payment details.
    const result = await pool.query(
      `SELECT
         campaigns.*,
         users.name AS creator_name,
         users.upi_id AS creator_upi_id,
         users.upi_qr_image AS creator_upi_qr_image
       FROM campaigns
       JOIN users
         ON campaigns.creator_id = users.id
       WHERE campaigns.id = $1`,
      [campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    const campaign = result.rows[0];

    // Approved campaigns are publicly accessible.
    if (campaign.status === "approved") {
      return res.json({ campaign });
    }

    // Check the session for unpublished campaigns.
    const cookies = req.headers.cookie;

    const sessionCookie = cookies
      ?.split(";")
      .find((cookie) =>
        cookie.trim().startsWith("fundora_session=")
      );

    if (!sessionCookie) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    const sessionToken = sessionCookie.trim().split("=")[1];

    const { createHash } = await import("crypto");

    const tokenHash = createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const userResult = await pool.query(
      `SELECT users.id, users.role
       FROM sessions
       JOIN users
         ON sessions.user_id = users.id
       WHERE sessions.token_hash = $1
         AND sessions.expires_at > NOW()`,
      [tokenHash]
    );

    // Only the campaign owner or an admin can view unpublished campaigns.
    if (
      userResult.rows.length === 0 ||
      (
        userResult.rows[0].role !== "admin" &&
        userResult.rows[0].id !== campaign.creator_id
      )
    ) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    return res.json({ campaign });
  } catch (error) {
    console.error("Fetch campaign error:", error);

    return res.status(500).json({
      message: "Something went wrong while fetching the campaign.",
    });
  }
});

// PUT /api/campaigns/:id
// Update an existing campaign.
router.put(
  "/:id",
  requireAuth,
  requireRole("user"),
  async (req, res) => {
    try {
      const campaignId = Number(req.params.id);

      if (!Number.isInteger(campaignId) || campaignId <= 0) {
        return res.status(400).json({
          message: "Invalid campaign ID.",
        });
      }

      const {
        title,
        description,
        category,
        goal,
        deadline,
        image,
      } = req.body;

      if (
        !title?.trim() ||
        !description?.trim() ||
        !category?.trim() ||
        goal === undefined ||
        !deadline
      ) {
        return res.status(400).json({
          message: "Please provide all required campaign details.",
        });
      }

      const campaignGoal = Number(goal);

      if (!Number.isFinite(campaignGoal) || campaignGoal <= 0) {
        return res.status(400).json({
          message: "Campaign goal must be a positive number.",
        });
      }

      const campaignDeadline = new Date(deadline);

      if (
        Number.isNaN(campaignDeadline.getTime()) ||
        campaignDeadline.toISOString().slice(0, 10) <=
          new Date().toISOString().slice(0, 10)
      ) {
        return res.status(400).json({
          message: "Please provide a valid future deadline.",
        });
      }

      const existingCampaign = await pool.query(
        `SELECT *
         FROM campaigns
         WHERE id = $1`,
        [campaignId]
      );

      if (existingCampaign.rows.length === 0) {
        return res.status(404).json({
          message: "Campaign not found.",
        });
      }

      const campaign = existingCampaign.rows[0];
      const creatorId = res.locals.user.id;

      if (campaign.creator_id !== creatorId) {
        return res.status(403).json({
          message: "You cannot edit another creator's campaign.",
        });
      }

      if (campaign.status === "approved") {
        return res.status(403).json({
          message: "Approved campaigns cannot be edited directly.",
        });
      }

      const result = await pool.query(
        `UPDATE campaigns
         SET
           title = $1,
           description = $2,
           category = $3,
           goal = $4,
           deadline = $5,
           image = $6,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [
          title.trim(),
          description.trim(),
          category.trim(),
          campaignGoal,
          deadline,
          image || null,
          campaignId,
        ]
      );

      return res.json({
        message: "Campaign updated successfully!",
        campaign: result.rows[0],
      });
    } catch (error) {
      console.error("Update campaign error:", error);

      return res.status(500).json({
        message: "Something went wrong while updating the campaign.",
      });
    }
  }
);

// DELETE /api/campaigns/:id
// Delete an unpublished campaign owned by the logged-in user.
router.delete(
  "/:id",
  requireAuth,
  requireRole("user"),
  async (req, res) => {
    try {
      const campaignId = Number(req.params.id);

      if (!Number.isInteger(campaignId) || campaignId <= 0) {
        return res.status(400).json({
          message: "Invalid campaign ID.",
        });
      }

      const result = await pool.query(
        `SELECT *
         FROM campaigns
         WHERE id = $1`,
        [campaignId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Campaign not found.",
        });
      }

      const campaign = result.rows[0];
      const creatorId = res.locals.user.id;

      if (campaign.creator_id !== creatorId) {
        return res.status(403).json({
          message: "You cannot delete another creator's campaign.",
        });
      }

      if (campaign.status === "approved") {
        return res.status(403).json({
          message: "Approved campaigns cannot be deleted directly.",
        });
      }

      await pool.query(
        `DELETE FROM campaigns
         WHERE id = $1`,
        [campaignId]
      );

      return res.json({
        message: "Campaign deleted successfully!",
      });
    } catch (error) {
      console.error("Delete campaign error:", error);

      return res.status(500).json({
        message: "Something went wrong while deleting the campaign.",
      });
    }
  }
);

export default router;
