
import { Router } from "express";
import { pool } from "../config/db.js";
import {
  requireAuth,
  requireRole,
} from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/contributions
// Create a pending contribution.
router.post("/", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const supporterId = res.locals.user.id;
    const { campaignId, amount } = req.body;

    const parsedCampaignId = Number(campaignId);
    const parsedAmount = Number(amount);

    if (
      !Number.isInteger(parsedCampaignId) ||
      parsedCampaignId <= 0 ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      Math.round(parsedAmount * 100) !== parsedAmount * 100
    ) {
      return res.status(400).json({
        message: "Please provide a valid campaign and contribution amount.",
      });
    }

    const campaignResult = await pool.query(
      `SELECT id, creator_id, status, deadline
       FROM campaigns
       WHERE id = $1`,
      [parsedCampaignId]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        message: "Campaign not found.",
      });
    }

    const campaign = campaignResult.rows[0];

    if (campaign.status !== "approved") {
      return res.status(400).json({
        message: "This campaign is not accepting contributions.",
      });
    }

    if (campaign.creator_id === supporterId) {
      return res.status(400).json({
        message: "You cannot contribute to your own campaign.",
      });
    }

    if (new Date(campaign.deadline) < new Date(new Date().toDateString())) {
      return res.status(400).json({
        message: "This campaign has already ended.",
      });
    }

    const result = await pool.query(
      `INSERT INTO contributions
       (supporter_id, campaign_id, amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [supporterId, parsedCampaignId, parsedAmount]
    );

    return res.status(201).json({
      message: "Contribution created. Complete your UPI payment.",
      contribution: result.rows[0],
    });
  } catch (error) {
    console.error("Create contribution error:", error);

    return res.status(500).json({
      message: "Failed to create contribution.",
    });
  }
});

// GET /api/contributions/my
// Get contributions made by the logged-in user.
router.get("/my", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const supporterId = res.locals.user.id;

    const result = await pool.query(
      `SELECT
         contributions.id,
         contributions.amount,
         contributions.status,
         contributions.utr_reference,
         contributions.created_at,
         contributions.campaign_id,
         campaigns.title AS campaign_title,
         campaigns.image AS campaign_image
       FROM contributions
       JOIN campaigns
         ON contributions.campaign_id = campaigns.id
       WHERE contributions.supporter_id = $1
       ORDER BY contributions.created_at DESC`,
      [supporterId]
    );

    return res.json({
      contributions: result.rows,
    });
  } catch (error) {
    console.error("Get my contributions error:", error);

    return res.status(500).json({
      message: "Failed to fetch your contributions.",
    });
  }
});

// GET /api/contributions/received
// Get contributions received by the logged-in creator.
router.get(
  "/received",
  requireAuth,
  requireRole("user"),
  async (req, res) => {
    try {
      const creatorId = res.locals.user.id;

      const result = await pool.query(
        `SELECT
           contributions.id,
           contributions.amount,
           contributions.status,
           contributions.utr_reference,
           contributions.created_at,
           contributions.campaign_id,
           campaigns.title AS campaign_title,
           users.name AS supporter_name
         FROM contributions
         JOIN campaigns
           ON contributions.campaign_id = campaigns.id
         JOIN users
           ON contributions.supporter_id = users.id
         WHERE campaigns.creator_id = $1
         ORDER BY contributions.created_at DESC`,
        [creatorId]
      );

      return res.json({
        contributions: result.rows,
      });
    } catch (error) {
      console.error("Get received contributions error:", error);

      return res.status(500).json({
        message: "Failed to fetch received contributions.",
      });
    }
  }
);


// PATCH /api/contributions/:id/amount
// Supporter updates the amount of their pending contribution.
router.patch(
  "/:id/amount",
  requireAuth,
  requireRole("user"),
  async (req, res) => {
    try {
      const supporterId = res.locals.user.id;
      const contributionId = Number(req.params.id);
      const parsedAmount = Number(req.body.amount);

      if (!Number.isInteger(contributionId) || contributionId <= 0) {
        return res.status(400).json({
          message: "Invalid contribution ID.",
        });
      }

      if (
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0 ||
        Math.round(parsedAmount * 100) !== parsedAmount * 100
      ) {
        return res.status(400).json({
          message: "Please enter a valid amount with at most 2 decimal places.",
        });
      }

      const result = await pool.query(
        `UPDATE contributions
         SET amount = $1
         WHERE id = $2
           AND supporter_id = $3
           AND status = 'pending'
           AND utr_reference IS NULL
         RETURNING *`,
        [parsedAmount, contributionId, supporterId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          message:
            "This contribution cannot be edited. It may already have a submitted reference or may have been reviewed.",
        });
      }

      return res.json({
        message: "Contribution amount updated successfully.",
        contribution: result.rows[0],
      });
    } catch (error) {
      console.error("Update contribution amount error:", error);

      return res.status(500).json({
        message: "Failed to update contribution amount.",
      });
    }
  }
);

// POST /api/contributions/:id/utr
// Supporter submits the UTR/reference number.
router.post(
  "/:id/utr",
  requireAuth,
  requireRole("user"),
  async (req, res) => {
    try {
      const supporterId = res.locals.user.id;
      const contributionId = Number(req.params.id);
      const { utrReference } = req.body;

      if (!Number.isInteger(contributionId) || contributionId <= 0) {
        return res.status(400).json({
          message: "Invalid contribution ID.",
        });
      }

      if (
        typeof utrReference !== "string" ||
        !/^[a-zA-Z0-9-]{6,100}$/.test(utrReference.trim())
      ) {
        return res.status(400).json({
          message: "Please enter a valid UTR/reference number.",
        });
      }

      const result = await pool.query(
        `UPDATE contributions
         SET utr_reference = $1
         WHERE id = $2
           AND supporter_id = $3
           AND status = 'pending'
         RETURNING *`,
        [utrReference.trim(), contributionId, supporterId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          message:
            "Contribution not found or it cannot accept a UTR/reference number.",
        });
      }

      return res.json({
        message: "Reference number submitted successfully. Awaiting creator verification.",
        contribution: result.rows[0],
      });
    } catch (error: any) {
      if (error.code === "23505") {
        return res.status(400).json({
          message: "This UTR/reference number has already been submitted.",
        });
      }

      console.error("Submit UTR error:", error);

      return res.status(500).json({
        message: "Failed to submit UTR/reference number.",
      });
    }
  }
);

// PATCH /api/contributions/:id/review
// Campaign creator confirms or rejects a contribution.
router.patch(
  "/:id/review",
  requireAuth,
  requireRole("user"),
  async (req, res) => {
    const creatorId = res.locals.user.id;
    const contributionId = Number(req.params.id);
    const { decision } = req.body;

    if (!Number.isInteger(contributionId) || contributionId <= 0) {
      return res.status(400).json({
        message: "Invalid contribution ID.",
      });
    }

    if (decision !== "confirm" && decision !== "reject") {
      return res.status(400).json({
        message: "Decision must be confirm or reject.",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const contributionResult = await client.query(
        `SELECT
           contributions.id,
           contributions.amount,
           contributions.status,
           contributions.utr_reference,
           contributions.campaign_id
         FROM contributions
         JOIN campaigns
           ON contributions.campaign_id = campaigns.id
         WHERE contributions.id = $1
           AND campaigns.creator_id = $2
         FOR UPDATE OF contributions`,
        [contributionId, creatorId]
      );

      if (contributionResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Contribution not found or you are not its campaign creator.",
        });
      }

      const contribution = contributionResult.rows[0];

      if (contribution.status !== "pending") {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "This contribution has already been reviewed.",
        });
      }

      if (!contribution.utr_reference) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "The supporter has not submitted a UTR/reference number yet.",
        });
      }

      const newStatus =
        decision === "confirm" ? "successful" : "failed";

      const updateResult = await client.query(
        `UPDATE contributions
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [newStatus, contributionId]
      );

      if (decision === "confirm") {
        await client.query(
          `UPDATE campaigns
           SET amount_raised = amount_raised + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [contribution.amount, contribution.campaign_id]
        );
      }

      await client.query("COMMIT");

      return res.json({
        message:
          decision === "confirm"
            ? "Contribution confirmed successfully."
            : "Contribution rejected successfully.",
        contribution: updateResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Review contribution error:", error);

      return res.status(500).json({
        message: "Failed to review contribution.",
      });
    } finally {
      client.release();
    }
  }
);

export default router;
