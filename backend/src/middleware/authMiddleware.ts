
import { Request, Response, NextFunction } from 'express'
import { createHash } from 'crypto'
import { pool } from '../config/db.js'

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Read the session cookie
    const cookies = req.headers.cookie

    const sessionCookie = cookies
      ?.split(';')
      .find((cookie) =>
        cookie.trim().startsWith('fundora_session=')
      )

    if (!sessionCookie) {
      res.status(401).json({
        message: 'Please log in to continue.',
      })
      return
    }

    // 2. Extract the session token
    const sessionToken = sessionCookie
      .trim()
      .split('=')[1]

    // 3. Hash the token
    const tokenHash = createHash('sha256')
      .update(sessionToken)
      .digest('hex')

    // 4. Verify the session in PostgreSQL
    const result = await pool.query(
      `SELECT users.id, users.name, users.email, users.role
       FROM sessions
       JOIN users ON sessions.user_id = users.id
       WHERE sessions.token_hash = $1
       AND sessions.expires_at > NOW()`,
      [tokenHash]
    )

    // 5. Reject invalid or expired sessions
    if (result.rows.length === 0) {
      res.status(401).json({
        message: 'Invalid or expired session.',
      })
      return
    }

    // 6. Make the authenticated user available
    // to the next middleware or route
    res.locals.user = result.rows[0]

    // 7. Continue to the requested route
    next()

  } catch (error) {
    console.error('Authentication error:', error)

    res.status(500).json({
      message: 'Something went wrong during authentication.',
    })
  }
}


export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {

    // Get the authenticated user
    const user = res.locals.user

    // Check whether the user has an allowed role
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        message: 'You do not have permission to perform this action.',
      })
      return
    }

    // Allow the request to continue
    next()
  }
}

