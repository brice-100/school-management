const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'school_db'
});

async function run() {
  try {
    const tablesToCheck = ['Evaluation', 'Paiement', 'Titulaire', 'Enseignant', 'Parents'];
    for(const t of tablesToCheck) {
      const [fks] = await pool.query(`
        SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = ? AND TABLE_SCHEMA = 'school_db' AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [t]);
      console.log(`FKs for ${t}:`, fks);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
