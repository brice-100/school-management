require('dotenv').config({ path: './.env' });
const mysql = require('mysql2/promise');

async function create() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'school_db'
  });

  try {
    // 1. Rename FicheEnseignant to RapportEnseignant if we want? No, let's just create Salaire and modify the model to use Salaire instead of FicheEnseignant.
    // Wait, let's create Salaire.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Salaire (
        idFiche INT AUTO_INCREMENT PRIMARY KEY,
        idPers INT,
        volume_horaire INT,
        taux_horaire INT,
        mois_annee VARCHAR(20),
        statut VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Salaire created');

    // 2. Message
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Messages (
        idMsg INT AUTO_INCREMENT PRIMARY KEY,
        idExp_Pers INT,
        idParent INT,
        objet VARCHAR(255),
        information TEXT,
        type_message VARCHAR(50),
        AnneeAcade VARCHAR(50),
        valider INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Messages created');

    // 3. Notification
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Notification (
        idNotif INT AUTO_INCREMENT PRIMARY KEY,
        idPers INT,
        titre VARCHAR(255),
        message TEXT,
        lue INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Notification created');

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
create();
