import { randomBytes, createHash } from "crypto";
import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";

const router = Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check whether all required fields are provided
    if (!name || !email || !password) {
      res.status(400).json({
        message: "Please provide all required fields.",
      });
      return;
    }

    // 2. Validate the input
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length === 0 || !cleanEmail.includes("@")) {
      res.status(400).json({
        message: "Please provide a valid name and email.",
      });
      return;
    }

    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
      return;
    }

    // 4. Hash the password before saving it
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Insert the new user into PostgreSQL
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
 VALUES ($1, $2, $3, 'user')
 RETURNING id, name, email, role, created_at`,
      [cleanName, cleanEmail, passwordHash],
    );

    // 6. Generate a secure session token
    const sessionToken = randomBytes(32).toString("hex");

    // 7. Hash the token before storing it
    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    // 8. Set the session expiry to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 9. Store the session in PostgreSQL
    await pool.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
   VALUES ($1, $2, $3)`,
      [result.rows[0].id, tokenHash, expiresAt],
    );

    // 10. Set the session cookie in the browser
    res.cookie("fundora_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // 6. Send the created user back to the frontend
    res.status(201).json({
      message: "Account created successfully!",
      user: result.rows[0],
    });
  } catch (error) {
    // Handle duplicate email addresses
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({
        message: "An account with this email already exists.",
      });
      return;
    }

    console.error("Signup error:", error);

    res.status(500).json({
      message: "Something went wrong while creating your account.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate the input
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        message: "Please provide your email and password.",
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Find the user in PostgreSQL
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [cleanEmail],
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    const user = result.rows[0];

    // 3. Compare the entered password with the stored hash
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    // 4. Generate a secure session token
    const sessionToken = randomBytes(32).toString("hex");

    // 5. Hash the token before storing it
    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    // 6. Set the session expiry to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 7. Store the session in PostgreSQL
    await pool.query(
      `INSERT INTO sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt],
    );

    // 8. Send the token through a secure cookie
    res.cookie("fundora_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // 9. Return user details without the password hash
    res.json({
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Something went wrong while logging in.",
    });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    // 1. Read the session cookie from the request
    const cookies = req.headers.cookie;

    const sessionCookie = cookies
      ?.split(";")
      .find((cookie) => cookie.trim().startsWith("fundora_session="));

    if (!sessionCookie) {
      res.status(401).json({
        message: "Not authenticated.",
      });
      return;
    }

    // 2. Extract the session token
    const sessionToken = sessionCookie.trim().split("=")[1];

    // 3. Hash the token to compare it with the database
    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

    // 4. Find a valid session and its associated user
    const result = await pool.query(
      `SELECT users.id, users.name, users.email, users.role
       FROM sessions
       JOIN users ON sessions.user_id = users.id
       WHERE sessions.token_hash = $1
       AND sessions.expires_at > NOW()`,
      [tokenHash],
    );

    // 5. Reject missing or expired sessions
    if (result.rows.length === 0) {
      res.status(401).json({
        message: "Session expired. Please log in again.",
      });
      return;
    }

    // 6. Return the authenticated user's details
    res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Session verification error:", error);

    res.status(500).json({
      message: "Something went wrong while verifying your session.",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    // 1. Read the session cookie
    const cookies = req.headers.cookie;

    const sessionCookie = cookies
      ?.split(";")
      .find((cookie) => cookie.trim().startsWith("fundora_session="));

    if (sessionCookie) {
      // 2. Extract the session token
      const sessionToken = sessionCookie.trim().split("=")[1];

      // 3. Hash the token
      const tokenHash = createHash("sha256").update(sessionToken).digest("hex");

      // 4. Delete the session from PostgreSQL
      await pool.query("DELETE FROM sessions WHERE token_hash = $1", [
        tokenHash,
      ]);
    }

    // 5. Clear the browser cookie
    res.clearCookie("fundora_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.json({
      message: "Logged out successfully!",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      message: "Something went wrong while logging out.",
    });
  }
});

export default router;
