// src/db.js
// MySQL connection pool. Import this file wherever you need to query MySQL.
//
// Prerequisites:
// 1. A .env file exists with DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_SSL
// 2. require('dotenv').config() is called BEFORE this file is imported
// 3. The tasks table already exists in MySQL

const fs = require('fs');
const path = require('path');
const mysql2 = require('mysql2/promise');

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'defaultdb',
  // If every connection is busy, queue the next request instead of crashing
  waitForConnections: true,
  // Maximum simultaneous connections from this Node process
  connectionLimit: 10,
  // 0 = unlimited waiting queue
  queueLimit: 0,
  // Aiven stores TIMESTAMPs in UTC — tell mysql2 so dates aren't shifted
  timezone: 'Z',
};

// Aiven Cloud (and most hosted MySQL services) require SSL.
// Local MySQL usually does not — leave DB_SSL unset for localhost.
if ((process.env.DB_SSL || '').toUpperCase() === 'REQUIRED') {
  poolConfig.ssl = { rejectUnauthorized: true };

  // Aiven uses its own certificate authority — trust it by loading ca.pem
  if (process.env.DB_SSL_CA) {
    const caPath = path.join(__dirname, '..', process.env.DB_SSL_CA);
    poolConfig.ssl.ca = fs.readFileSync(caPath);
  }
}

const pool = mysql2.createPool(poolConfig);

module.exports = pool;
