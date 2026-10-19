require('dotenv').config();
const mysql = require('mysql2/promise');

const host = process.env.DB_HOST || '127.0.0.1';
const useSsl =
  String(process.env.DB_SSL).trim().toLowerCase() === 'true' ||
  host.includes('tidbcloud.com');

const pool = mysql.createPool({
  host,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'currensee',
  waitForConnections: true,
  connectionLimit: process.env.VERCEL ? 3 : 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: useSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
});

module.exports = pool;