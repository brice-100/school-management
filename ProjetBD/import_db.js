require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDb() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    const sqlPath = path.join(__dirname, 'school_fixed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("Importing SQL schema...");
    await pool.query(sql);
    console.log("SQL Schema imported successfully!");
  } catch (err) {
    console.error("Error importing SQL schema:", err);
  } finally {
    process.exit(0);
  }
}

importDb();
