import { Router } from "express";
import { pool } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/payment-settings
// Retrieve the logged-in user's UPI details.
router.get("/", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const userId = res.locals.user.id;

    const result = await pool.query(
      `SELECT upi_id, upi_qr_image
         FROM users
         WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "User not found.",
      });
      return;
    }

    res.json({
      paymentSettings: result.rows[0],
    });
  } catch (error) {
    console.error("Payment settings fetch error:", error);

    res.status(500).json({
      message: "Failed to retrieve payment settings.",
    });
  }
});

// PUT /api/payment-settings
// Save or update the logged-in user's UPI details.
router.put("/", requireAuth, requireRole("user"), async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const { upi_id, upi_qr_image } = req.body;

    // Validate UPI ID.
    if (typeof upi_id !== "string" || upi_id.trim().length === 0) {
      res.status(400).json({
        message: "Please provide a valid UPI ID.",
      });
      return;
    }

    const cleanUpiId = upi_id.trim();

    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

    if (cleanUpiId.length > 100 || !upiPattern.test(cleanUpiId)) {
      res.status(400).json({
        message: "Please enter a valid UPI ID.",
      });
      return;
    }

    // Validate QR image.
    if (
      upi_qr_image !== null &&
      (typeof upi_qr_image !== "string" ||
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
          upi_qr_image,
        ))
    ) {
      res.status(400).json({
        message: "Please upload a valid PNG, JPEG or WebP QR image.",
      });
      return;
    }

    // Limit the decoded image size to 5 MB.
    if (upi_qr_image !== null) {
      const base64Data = upi_qr_image.split(",")[1];
      const imageSize = Buffer.from(base64Data, "base64").length;

      if (imageSize > 5 * 1024 * 1024) {
        res.status(400).json({
          message: "QR code image must be smaller than 5 MB.",
        });
        return;
      }
    }

    const result = await pool.query(
      `UPDATE users
         SET upi_id = $1,
             upi_qr_image = $2
         WHERE id = $3
         RETURNING upi_id, upi_qr_image`,
      [cleanUpiId, upi_qr_image, userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "User not found.",
      });
      return;
    }

    res.json({
      message: "Payment settings saved successfully.",
      paymentSettings: result.rows[0],
    });
  } catch (error) {
    console.error("Payment settings update error:", error);

    res.status(500).json({
      message: "Failed to save payment settings.",
    });
  }
});

export default router;
