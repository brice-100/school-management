const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'school_db'
});

async function run() {
  try {
    const [rows] = await pool.query('SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = "salaires" AND TABLE_SCHEMA = "school_db"');
    console.log("salaires FKs:", rows);
    
    const [rows2] = await pool.query('SELECT * FROM salaires LIMIT 1');
    console.log("salaires sample:", rows2);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
