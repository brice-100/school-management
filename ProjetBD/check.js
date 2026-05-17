require('dotenv').config();
const pool = require('./src/config/db');
async function run() {
  try {
    const [rows] = await pool.query("SHOW COLUMNS FROM MessageInterne WHERE Field = 'matricule_eleve'");
    console.log('MessageInterne matricule_eleve type:', rows[0].Type);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
