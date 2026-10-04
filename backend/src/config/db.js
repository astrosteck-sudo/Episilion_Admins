require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false },
});

// Test connection once at startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL database ✅');
    conn.release();
  } catch (err) {
    console.error('Database connection failed ❌:', err.message);
  }
})();

module.exports = pool;