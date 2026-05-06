require('dotenv').config();
const mysql = require('mysql2/promise');

async function fix() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    const [rows] = await pool.query('DESCRIBE Personne');
    const hasPhoto = rows.some(r => r.Field === 'photo');
    
    if (!hasPhoto) {
      await pool.query("ALTER TABLE Personne ADD COLUMN photo VARCHAR(255) DEFAULT 'INDEFINI' AFTER idAdmin");
      console.log('Column photo added to Personne');
    } else {
      console.log('Column photo already exists');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
