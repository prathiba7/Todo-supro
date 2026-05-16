
// apps/server/src/db/pool.js
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ← THIS IS THE FIX: Render PostgreSQL requires SSL
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL')
})

pool.on('error', (err) => {
  console.error('✗ DB pool error:', err.message)
})

module.exports = pool
