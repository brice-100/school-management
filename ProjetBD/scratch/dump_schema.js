const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'school_db'
});

async function run() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    for (const tObj of tables) {
      const tName = Object.values(tObj)[0];
      const [cols] = await pool.query(`SHOW COLUMNS FROM ${tName}`);
      console.log(`--- TABLE: ${tName} ---`);
      console.log(cols.map(c => c.Field).join(', '));
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
