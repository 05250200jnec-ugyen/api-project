// test-db.js — run once to prove MySQL works, then delete this file
require('dotenv').config();
const pool = require('./src/db');

async function test() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok, DATABASE() AS db, NOW() AS now');
    console.log('Connected to MySQL');
    console.log(rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Connection failed');
    console.error(err.message);
    process.exit(1);
  }
}

test();
