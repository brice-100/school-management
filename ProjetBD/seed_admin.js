require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log("Tables in DB:", tables.map(t => Object.values(t)[0]));

    if (!tables.map(t => Object.values(t)[0].toLowerCase()).includes('admin')) {
      console.log("ERROR: Admin table does not exist!");
      process.exit(1);
    }

    const email = process.env.ADMIN_EMAIL || 'admin@ecole.com';
    const plainPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
    
    // Check if admin exists
    const [admins] = await pool.query('SELECT * FROM Admin WHERE username = ?', [email]);
    if (admins.length === 0) {
      console.log("Creating default admin...");
      const hashed = await bcrypt.hash(plainPassword, 10);
      
      // Auto-increment might not be set for ID, let's use a manual one or check if it's auto-increment
      // In school_fixed.sql: `ID` int UNSIGNED NOT NULL, (No AUTO_INCREMENT!)
      await pool.query(`INSERT INTO Admin (ID, nom, username, password, typeAdmin, mobile, alanyaID, created_at) VALUES (1, 'Super Admin', ?, ?, 0, '0000', '0', NOW())`, [email, hashed]);
      console.log(`Default admin created: ${email} / ${plainPassword}`);
    } else {
      console.log(`Admin already exists. Use: ${email} / ${plainPassword}`);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
