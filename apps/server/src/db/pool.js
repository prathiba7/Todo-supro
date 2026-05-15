
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep up to 10 connections open
  max: 10,
  // Close idle connections after 30 seconds
  idleTimeoutMillis: 30000,
  // Timeout if we wait > 2s for a connection
  connectionTimeoutMillis: 2000,
});

// Test the connection when the server starts
pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
  process.exit(-1);
});

module.exports = pool;
