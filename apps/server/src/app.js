const express = require('express')
const cors    = require('cors')
require('dotenv').config()

const authRoutes  = require('./routes/auth')
const taskRoutes  = require('./routes/tasks')
const goalRoutes  = require('./routes/goals')
const hard75Routes= require('./routes/hard75')

const app  = express()
const PORT = process.env.PORT || 5000

// Allow both local dev and production frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',       // vite preview
  process.env.FRONTEND_URL,      // set this in Render env vars
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

app.use(express.json())

app.use('/api/auth',   authRoutes)
app.use('/api/tasks',  taskRoutes)
app.use('/api/goals',  goalRoutes)
app.use('/api/hard75', hard75Routes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Supro API is live!' })
})

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ error: 'Internal server error.' })
})

app.listen(PORT, () => {
  console.log(`Supro API running on port ${PORT}`)
})

module.exports = app