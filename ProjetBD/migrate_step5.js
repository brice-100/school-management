require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    const [annees] = await pool.query('SELECT idAnnee FROM AnneeAcademique ORDER BY idAnnee DESC LIMIT 1');
    const defaultAnnee = annees.length > 0 ? annees[0].idAnnee : 1;

    console.log('Adding idAnnee to Cours...');
    await pool.query(`ALTER TABLE Cours ADD COLUMN idAnnee INT DEFAULT ${defaultAnnee}`);

    console.log('Adding idAnnee to EmploiDuTemps...');
    await pool.query(`ALTER TABLE EmploiDuTemps ADD COLUMN idAnnee INT DEFAULT ${defaultAnnee}`);

    console.log('Migration successful.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column idAnnee already exists.');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
