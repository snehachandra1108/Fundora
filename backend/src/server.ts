
import contributionRoutes from './contributions/contributionRoutes.js'
import adminRoutes from './admin/adminRoutes.js'
import campaignRoutes from './campaigns/campaignRoutes.js'
import paymentSettingsRoutes from './paymentSettings/paymentSettingsRoutes.js'

import {
  requireAuth,
  requireRole,
} from './middleware/authMiddleware.js'

import authRoutes from './auth/authRoutes.js'
import express from 'express'
import cors from 'cors'
import { pool } from './config/db.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)

// Allow Base64 QR images up to the configured upload limit.
app.use(express.json({ limit: '8mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/contributions', contributionRoutes)
app.use('/api/payment-settings', paymentSettingsRoutes)

app.get('/', (req, res) => {
  res.send('Fundora backend is running!')
})

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')

    res.json({
      message: 'Database connected successfully!',
      time: result.rows[0].now,
    })
  } catch (error) {
    console.error('Database connection failed:', error)

    res.status(500).json({
      message: 'Database connection failed.',
    })
  }
})

// Temporary protected route for testing authentication
app.get('/api/protected-test', requireAuth, (req, res) => {
  res.json({
    message: 'You have accessed a protected route!',
    user: res.locals.user,
  })
})

// Temporary creator-only route for testing authorization
app.get(
  '/api/creator-test',
  requireAuth,
  requireRole('creator'),
  (req, res) => {
    res.json({
      message: 'You have accessed a creator-only route!',
      user: res.locals.user,
    })
  }
)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
