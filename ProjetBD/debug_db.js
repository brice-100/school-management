require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');

async function debug() {
  const pool = mysql.createPool({
    host: 'localhost', user: 'root', password: 'root', database: 'school_db'
  });

  const check = async (table) => {
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM ${table}`);
      console.log(`\n--- ${table} ---`);
      console.log(cols.map(c => c.Field).join(', '));
    } catch (e) {
      console.log(`\n--- ${table} ERROR ---`);
      console.log(e.message);
    }
  };

  await check('Classe');
  await check('Cours');
  await check('Paiement');
  await check('Evaluation');
  await check('Note');
  await check('Bulletin');
  await check('Personne');

  process.exit(0);
}
debug();
