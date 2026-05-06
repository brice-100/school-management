require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    console.log('Adding est_active to AnneeAcademique...');
    await pool.query('ALTER TABLE AnneeAcademique ADD COLUMN est_active TINYINT(1) DEFAULT 0');
    console.log('Setting the latest year to active...');
    await pool.query('UPDATE AnneeAcademique SET est_active = 1 ORDER BY idAnnee DESC LIMIT 1');
    console.log('Migration successful.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column est_active already exists.');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
